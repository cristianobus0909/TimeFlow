import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Sparkles,
  Bot,
  Brain,
  Send,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Zap,
  TrendingDown,
} from 'lucide-react';
import { api } from '@shared/services/api';
import { Card } from '@shared/components/Card';
import { Button } from '@shared/components/Button';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const AIDashboardPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '¡Hola! Soy tu Business & Productivity Coach. Pregúntame sobre tus proyectos, tareas, clientes o facturación (ej: "¿Cuánto facturé?", "¿Qué proyectos tengo registrados?").',
      timestamp: new Date(),
    },
  ]);

  // Queries
  const { data: briefData, isLoading: isBriefLoading } = useQuery({
    queryKey: ['ai-daily-brief'],
    queryFn: () => api.get('/ai/daily-brief'),
  });

  const { data: insights = [], isLoading: isInsightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.get('/ai/insights'),
  });

  // Chat/Search Mutation
  const searchMutation = useMutation({
    mutationFn: (text: string) => api.post('/ai/search', { query: text }),
    onSuccess: (data: any) => {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: data.answer || 'No obtuve una respuesta consistente del servidor.',
          timestamp: new Date(),
        },
      ]);
    },
    onError: (err: any) => {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: `Error de conexión: ${err.message || 'Intente nuevamente más tarde.'}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    const currentQuery = query;
    setQuery('');

    // Trigger AI processing
    searchMutation.mutate(currentQuery);
  };

  return (
    <div className="flex flex-col gap-6 select-text text-left">
      {/* Header controls */}
      <div className="flex justify-between items-center bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand-purple animate-pulse" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100 font-display">Asistente Ejecutivo & AI Coach</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Asesoramiento inteligente de negocio y productividad</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Daily Brief & Insights */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Daily Briefing Card */}
          <Card className="relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-purple" />
            <div className="pl-2">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block mb-1">
                Resumen Diario Inteligente (Daily Brief)
              </span>
              {isBriefLoading ? (
                <div className="text-xs text-zinc-550 py-4">Generando tu briefing matutino...</div>
              ) : (
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {briefData?.brief}
                </div>
              )}
            </div>
          </Card>

          {/* Productivity & Business Coach recommendations list */}
          <Card className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200">Recomendaciones del Coach</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Alertas de riesgo de proyectos y sugerencias comerciales</p>
            </div>

            <div className="flex flex-col gap-3">
              {isInsightsLoading ? (
                <div className="text-xs text-zinc-500 text-center py-4">Analizando métricas...</div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-650">Todo al día. No hay desvíos identificados.</div>
              ) : (
                insights.map((ins: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed select-text ${
                      ins.severity === 'RED'
                        ? 'bg-rose-955/10 border-rose-900/40 text-rose-350'
                        : ins.severity === 'YELLOW'
                        ? 'bg-amber-955/10 border-amber-900/40 text-amber-350'
                        : 'bg-zinc-950 border-zinc-900 text-zinc-350'
                    }`}
                  >
                    {ins.severity === 'RED' ? (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    ) : ins.severity === 'YELLOW' ? (
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                    ) : (
                      <Zap className="w-5 h-5 flex-shrink-0 text-brand-purple" />
                    )}

                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-zinc-200">{ins.title}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1">{ins.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Chat / Search */}
        <Card className="flex flex-col justify-between h-[70vh] bg-zinc-950/40 border border-zinc-900 p-4 rounded-2xl">
          {/* Chat header */}
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Bot className="w-4 h-4 text-brand-purple" />
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Buscador Conversacional</h3>
              <span className="text-[9px] text-zinc-550">Responde basándose en datos de tu negocio</span>
            </div>
          </div>

          {/* Chat thread list */}
          <div className="flex-grow overflow-y-auto my-4 pr-1 flex flex-col gap-3">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'ai'
                    ? 'bg-zinc-900/50 border border-zinc-900 text-zinc-300 align-self-start mr-auto'
                    : 'bg-brand-purple text-zinc-100 align-self-end ml-auto'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {searchMutation.isPending && (
              <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 align-self-start mr-auto p-2 bg-zinc-900/30 rounded-xl">
                <Brain className="w-3.5 h-3.5 animate-spin" />
                Procesando consulta...
              </div>
            )}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendChat} className="flex gap-2 border-t border-zinc-900 pt-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pregúntale a la IA (ej. ¿Cuánto gané?)..."
              disabled={searchMutation.isPending}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-zinc-700"
            />
            <Button type="submit" disabled={!query.trim() || searchMutation.isPending} className="h-10" leftIcon={<Send className="w-3.5 h-3.5" />} />
          </form>
        </Card>
      </div>
    </div>
  );
};
export default AIDashboardPage;
