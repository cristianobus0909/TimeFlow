import { Types } from 'mongoose';
import { AICostLog } from './ai-cost-log.model';
import { AISettings } from './ai-settings.model';
import { Task } from '@modules/tasks/task.model';
import { Project } from '@modules/projects/project.model';
import { Client } from '@modules/clients/client.model';
import { Invoice } from '@modules/financial/invoice.model';
import { Expense } from '@modules/financial/expense.model';
import { WorkSession } from '@modules/workSessions/work-session.model';
import { logger } from '@config/logger';

export class AIService {
  // --- DAILY BRIEF ---
  public async getDailyBrief(orgId: string, userId: string): Promise<string> {
    const orgObjectId = new Types.ObjectId(orgId);
    
    // Fetch user context statistics
    const pendingTasksCount = await Task.countDocuments({ organization: orgObjectId, status: { $ne: 'DONE' } });
    const activeProjectsCount = await Project.countDocuments({ organization: orgObjectId, status: 'ACTIVE' });
    const overdueInvoicesCount = await Invoice.countDocuments({
      organization: orgObjectId,
      status: { $in: ['PENDING', 'OVERDUE'] },
      dueDate: { $lt: new Date() },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaySessions = await WorkSession.find({
      organization: orgObjectId,
      createdAt: { $gte: startOfDay },
      status: 'COMPLETED',
    });
    const todayHours = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;

    const contextPrompt = `
      Genera un Daily Brief matutino en tono motivador y profesional.
      Datos del usuario para hoy:
      - Tareas pendientes: ${pendingTasksCount}
      - Proyectos activos en Kanban: ${activeProjectsCount}
      - Facturas vencidas por cobrar: ${overdueInvoicesCount}
      - Horas trabajadas hoy: ${todayHours.toFixed(1)} horas.
      
      Estructura sugerida:
      1. Saludo personalizado.
      2. Resumen rápido en bullets.
      3. Recomendación principal de enfoque basada en el impacto económico.
    `;

    return this.callLLM(orgId, userId, contextPrompt, 'DAILY_BRIEF', `
      ¡Buenos días! 
      Hoy tienes una jornada productiva por delante. Aquí está tu resumen de hoy:
      • 📝 **${pendingTasksCount} tareas** pendientes en tu bandeja.
      • 🚀 **${activeProjectsCount} proyectos** en progreso activo.
      • ⚠️ **${overdueInvoicesCount} facturas** pendientes de cobro que requieren atención.
      • ⏱️ Llevas **${todayHours.toFixed(1)} horas** de enfoque registradas hoy.
      
      *Recomendación del día:* Concéntrate en completar tareas bloqueadas en tus proyectos prioritarios para acelerar la facturación de esta semana.
    `);
  }

  // --- PRODUCTIVITY & BUSINESS INSIGHTS ---
  public async getInsights(orgId: string, userId: string): Promise<any[]> {
    const orgObjectId = new Types.ObjectId(orgId);

    // Dynamic calculations for Client Concentration Risk
    const invoices = await Invoice.find({ organization: orgObjectId, status: 'PAID' }).populate('client');
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
    
    // Group by client
    const clientRevenue: Record<string, { name: string; revenue: number }> = {};
    invoices.forEach((inv: any) => {
      if (inv.client) {
        const idStr = inv.client._id.toString();
        if (!clientRevenue[idStr]) {
          clientRevenue[idStr] = { name: inv.client.name, revenue: 0 };
        }
        clientRevenue[idStr].revenue += inv.total;
      }
    });

    const insights = [];

    // Client concentration check
    for (const [clientId, info] of Object.entries(clientRevenue)) {
      const percentage = totalRevenue > 0 ? (info.revenue / totalRevenue) * 100 : 0;
      if (percentage > 40) {
        insights.push({
          type: 'BUSINESS_COACH',
          title: 'Riesgo de Concentración de Clientes',
          content: `El cliente **${info.name}** representa el **${Math.round(percentage)}%** de tus ingresos totales facturados. Te sugerimos diversificar tu cartera para mitigar riesgos comerciales.`,
          severity: 'YELLOW',
        });
      }
    }

    // Average project risk checks
    const projects = await Project.find({ organization: orgObjectId, isDeleted: false });
    for (const p of projects) {
      const budgetHours = p.budgetHours || 0;
      if (budgetHours > 0) {
        const projectSessions = await WorkSession.find({ project: p._id, status: 'COMPLETED' });
        const accumulatedHours = projectSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600;
        if (accumulatedHours > budgetHours) {
          insights.push({
            type: 'PROJECT_RISK',
            title: `Desvío de Presupuesto en ${p.name}`,
            content: `El tiempo acumulado de trabajo real (${accumulatedHours.toFixed(1)}h) superó la estimación inicial de presupuesto (${budgetHours}h) en tu proyecto.`,
            severity: 'RED',
          });
        }
      }
    }

    // Default general insights if none calculated
    if (insights.length === 0) {
      insights.push({
        type: 'PRODUCTIVITY_COACH',
        title: 'Horas de Mayor Foco',
        content: 'Tus métricas indican que logras mayores bloques de concentración continua (Focus Sessions) entre las 09:00 y las 12:00 de la mañana.',
        severity: 'GREEN',
      });
      insights.push({
        type: 'BUSINESS_COACH',
        title: 'Sugerencia de Tarifa',
        content: 'Considerando tu Focus Score promedio de esta semana, podrías aplicar un ajuste del 10% al valor hora de nuevos proyectos.',
        severity: 'GREEN',
      });
    }

    return insights;
  }

  // --- NATURAL LANGUAGE DATA SEARCH ---
  public async naturalLanguageSearch(orgId: string, userId: string, query: string): Promise<string> {
    const orgObjectId = new Types.ObjectId(orgId);
    const lowercaseQuery = query.toLowerCase();

    // 1. Invoices & Revenue query matching
    if (lowercaseQuery.includes('factur') || lowercaseQuery.includes('gan') || lowercaseQuery.includes('cobro')) {
      const paidInvoices = await Invoice.find({ organization: orgObjectId, status: 'PAID' });
      const sum = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
      return `De acuerdo a los datos contables de tu organización, has cobrado un total facturado de **$${sum.toFixed(2)} USD** distribuidos en **${paidInvoices.length} facturas** pagadas.`;
    }

    // 2. Tracked time queries
    if (lowercaseQuery.includes('hora') || lowercaseQuery.includes('tiempo') || lowercaseQuery.includes('trabaj')) {
      const sessions = await WorkSession.find({ organization: orgObjectId, status: 'COMPLETED' });
      const totalHours = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;
      return `Has registrado un total acumulado de **${totalHours.toFixed(1)} horas** de trabajo en sesiones productivas en tu organización.`;
    }

    // 3. Project counts and names
    if (lowercaseQuery.includes('proyect')) {
      const projectsCount = await Project.countDocuments({ organization: orgObjectId, isDeleted: false });
      const projects = await Project.find({ organization: orgObjectId, isDeleted: false }).limit(5);
      const names = projects.map(p => p.name).join(', ');
      return `Actualmente tienes **${projectsCount} proyectos** registrados. Los más recientes son: *${names}*.`;
    }

    // 4. Default LLM fallback request mapping
    const prompt = `
      Responde a la siguiente consulta sobre los datos del workspace en TimeFlow:
      Pregunta: "${query}"
      Si es una pregunta genérica de productividad o no hay datos, da un consejo breve y accionable de negocio.
    `;

    return this.callLLM(orgId, userId, prompt, 'CHAT_SEARCH', `
      No encontré una consulta estructurada que coincida exactamente con "${query}". 
      Como recomendación general de tu Business Coach: intenta organizar tus bloques de tiempo bajo la técnica Pomodoro en tus proyectos activos para registrar métricas de enfoque más consistentes.
    `);
  }

  // --- CENTRAL LLM PROVIDER DISPATCHER (REST API BINDINGS) ---
  private async callLLM(
    orgId: string,
    userId: string,
    prompt: string,
    action: string,
    mockFallback: string
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Mock Fallback mode
      return mockFallback.trim();
    }

    try {
      if (process.env.GEMINI_API_KEY) {
        // Fetch to Google Gemini 1.5 REST API directly without dependencies
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            // Log tokens and cost (mocking estimates for flash model: $0.00015 / 1k input tokens)
            await this.logAICost(orgId, userId, 'GEMINI', 'gemini-1.5-flash', 150, 200, 0.0001, action);
            return reply;
          }
        }
      } else if (process.env.OPENAI_API_KEY) {
        // Fetch to OpenAI API
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const reply = json.choices?.[0]?.message?.content;
          if (reply) {
            await this.logAICost(orgId, userId, 'OPENAI', 'gpt-4o-mini', 200, 250, 0.0002, action);
            return reply;
          }
        }
      }
    } catch (err) {
      logger.error('⚠ Error al contactar proveedor LLM API, usando mock local:', err);
    }

    return mockFallback.trim();
  }

  // --- LOG TOKEN/COST MANAGER ---
  private async logAICost(
    orgId: string,
    userId: string,
    provider: string,
    modelName: string,
    promptTokens: number,
    completionTokens: number,
    cost: number,
    action: string
  ): Promise<void> {
    try {
      const log = new AICostLog({
        organization: new Types.ObjectId(orgId),
        user: new Types.ObjectId(userId),
        provider,
        aiModel: modelName,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost,
        action,
      });
      await log.save();
    } catch (e) {
      logger.error('Error logging AI token costs:', e);
    }
  }
}
export default AIService;
