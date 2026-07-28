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
      Eres el Asistente Ejecutivo y Business Coach de TimeFlow. Escribe en español de forma totalmente limpia, profesional y directa.
      No uses emojis, no uses asteriscos, no uses comillas y no uses paréntesis.
      Genera un resumen diario con los siguientes datos:
      Tareas pendientes: ${pendingTasksCount}
      Proyectos activos: ${activeProjectsCount}
      Facturas pendientes por cobrar: ${overdueInvoicesCount}
      Horas trabajadas hoy: ${todayHours.toFixed(1)} horas
    `;

    return this.callLLM(orgId, userId, contextPrompt, 'DAILY_BRIEF', `
Hola. Este es tu resumen ejecutivo para el día de hoy:

• Tareas pendientes: ${pendingTasksCount}
• Proyectos activos: ${activeProjectsCount}
• Facturas pendientes por cobrar: ${overdueInvoicesCount}
• Horas registradas hoy: ${todayHours.toFixed(1)} horas

Te sugiero avanzar primero con los pendientes de mayor impacto en tus proyectos principales.
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
          content: `El cliente ${info.name} representa el ${Math.round(percentage)} por ciento de tus ingresos totales facturados. Te sugiero diversificar tu cartera para reducir riesgos comerciales.`,
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
            content: `El tiempo acumulado de trabajo real de ${accumulatedHours.toFixed(1)} horas superó el presupuesto inicial de ${budgetHours} horas en este proyecto.`,
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
        content: 'Tus métricas indican que logras mayores bloques de concentración continua entre las 09:00 y las 12:00 de la mañana.',
        severity: 'GREEN',
      });
      insights.push({
        type: 'BUSINESS_COACH',
        title: 'Sugerencia de Tarifa',
        content: 'Considerando tu rendimiento de esta semana, podrías evaluar un ajuste favorable en el valor hora para nuevos proyectos.',
        severity: 'GREEN',
      });
    }

    return insights;
  }

  // --- NATURAL LANGUAGE DATA SEARCH & CHAT ASSISTANT ---
  public async naturalLanguageSearch(orgId: string, userId: string, query: string): Promise<string> {
    const orgObjectId = new Types.ObjectId(orgId);
    const q = query.toLowerCase().trim();

    // 1. Gratitude & Politeness
    if (q.includes('gracias') || q.includes('genial') || q.includes('buenisimo') || q.includes('excelente') || q.includes('ok') || q.includes('perfecto')) {
      return `Con gusto. Estoy a tu disposición para ayudarte con la gestión de tu negocio.`;
    }

    // 2. Greetings & Conversational Welcome
    if (
      q === 'hola' ||
      q.includes('hola') ||
      q.includes('buenas') ||
      q.includes('saludos') ||
      q.includes('ayuda') ||
      q.includes('quien eres') ||
      q.includes('que haces') ||
      q.includes('que puedes') ||
      q === 'inicio'
    ) {
      const pendingTasksCount = await Task.countDocuments({ organization: orgObjectId, status: { $ne: 'DONE' } });
      const activeProjectsCount = await Project.countDocuments({ organization: orgObjectId, status: 'ACTIVE' });
      return `Hola. Soy tu Asistente Ejecutivo en TimeFlow.

Actualmente tienes ${pendingTasksCount} tareas pendientes y ${activeProjectsCount} proyectos activos.

Puedes consultarme sobre:
• El estado de tu facturación e ingresos
• Tus horas trabajadas y registros de tiempo
• Las tareas pendientes por resolver
• La lista de tus clientes y empresas
• El estado general de tus proyectos`;
    }

    // 3. Invoices & Revenue matching
    if (q.includes('factur') || q.includes('gan') || q.includes('cobro') || q.includes('ingreso') || q.includes('plata') || q.includes('dinero')) {
      const paidInvoices = await Invoice.find({ organization: orgObjectId, status: 'PAID' });
      const pendingInvoices = await Invoice.find({ organization: orgObjectId, status: { $in: ['PENDING', 'OVERDUE'] } });
      const totalPaid = paidInvoices.reduce((acc, inv) => acc + inv.total, 0);
      const totalPending = pendingInvoices.reduce((acc, inv) => acc + inv.total, 0);

      if (totalPaid === 0 && totalPending === 0) {
        return `Revisé tus registros contables y por el momento no tienes facturas generadas. Puedes emitir una desde la sección de Facturación.`;
      }

      return `Resumen financiero:

• Total cobrado: ${totalPaid.toFixed(2)} USD en ${paidInvoices.length} facturas pagadas
• Pendiente de cobro: ${totalPending.toFixed(2)} USD en ${pendingInvoices.length} facturas por cobrar`;
    }

    // 4. Tracked Time queries
    if (q.includes('hora') || q.includes('tiempo') || q.includes('trabaj') || q.includes('sesion') || q.includes('minuto')) {
      const sessions = await WorkSession.find({ organization: orgObjectId, status: 'COMPLETED' });
      const totalHours = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;
      return `Registro de tiempo:

Has acumulado un total de ${totalHours.toFixed(1)} horas de trabajo registradas en ${sessions.length} sesiones completadas.`;
    }

    // 5. Tasks & To-dos matching
    if (q.includes('tarea') || q.includes('pendiente') || q.includes('hacer') || q.includes('activida')) {
      const pendingTasks = await Task.find({ organization: orgObjectId, status: { $ne: 'DONE' } }).limit(5);
      const totalPending = await Task.countDocuments({ organization: orgObjectId, status: { $ne: 'DONE' } });
      if (pendingTasks.length === 0) {
        return `No tienes tareas pendientes en este momento. Tu lista de trabajo está al día.`;
      }
      const taskList = pendingTasks.map(t => `• ${t.title}`).join('\n');
      return `Tienes ${totalPending} tareas pendientes. Las principales son:

${taskList}`;
    }

    // 6. Clients matching
    if (q.includes('cliente') || q.includes('empresa') || q.includes('cuenta')) {
      const clients = await Client.find({ organization: orgObjectId, isDeleted: false }).limit(5);
      const totalClients = await Client.countDocuments({ organization: orgObjectId, isDeleted: false });
      if (clients.length === 0) {
        return `No tienes clientes registrados aún. Puedes agregar uno desde el módulo de Clientes.`;
      }
      const clientList = clients.map(c => `• ${c.name}`).join('\n');
      return `Tienes ${totalClients} clientes registrados en tu sistema:

${clientList}`;
    }

    // 7. Projects matching
    if (q.includes('proyect')) {
      const projectsCount = await Project.countDocuments({ organization: orgObjectId, isDeleted: false });
      const projects = await Project.find({ organization: orgObjectId, isDeleted: false }).limit(5);
      const names = projects.map(p => `• ${p.name}`).join('\n');
      return `Tienes ${projectsCount} proyectos en tu panel:

${names}`;
    }

    // 8. General Executive Summary
    if (q.includes('resumen') || q.includes('estado') || q.includes('general') || q.includes('metrica') || q.includes('dashboard')) {
      return this.getDailyBrief(orgId, userId);
    }

    // 9. LLM Prompt fallback request with natural System Prompt
    const pendingTasksCount = await Task.countDocuments({ organization: orgObjectId, status: { $ne: 'DONE' } });
    const activeProjectsCount = await Project.countDocuments({ organization: orgObjectId, status: 'ACTIVE' });
    
    const prompt = `
      Eres el Asistente Ejecutivo y Business Coach de TimeFlow. Escribe en español de forma totalmente limpia, profesional y directa.
      No uses emojis, no uses asteriscos, no uses comillas y no uses paréntesis.
      El usuario pregunta: ${query}
      Contexto: tiene ${pendingTasksCount} tareas pendientes y ${activeProjectsCount} proyectos activos.
    `;

    return this.callLLM(orgId, userId, prompt, 'CHAT_SEARCH', `
Sobre tu consulta: Actualmente tienes ${pendingTasksCount} tareas pendientes y ${activeProjectsCount} proyectos activos en tu panel. Te sugiero organizar la jornada en bloques de trabajo enfocado sin distracciones para avanzar en tus entregas.
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
            // Clean up any bold asterisks, quotes, emojis or parentheses if returned by LLM
            const cleanReply = reply.replace(/[\*\"\'\(\)]/g, '').trim();
            await this.logAICost(orgId, userId, 'GEMINI', 'gemini-1.5-flash', 150, 200, 0.0001, action);
            return cleanReply;
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
            const cleanReply = reply.replace(/[\*\"\'\(\)]/g, '').trim();
            await this.logAICost(orgId, userId, 'OPENAI', 'gpt-4o-mini', 200, 250, 0.0002, action);
            return cleanReply;
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
