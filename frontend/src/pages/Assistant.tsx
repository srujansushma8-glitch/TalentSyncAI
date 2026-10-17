import React, { useState } from 'react';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Database,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text:
        "Hello! I am your explainable workforce intelligence assistant. You can ask me questions about candidate matching, workforce capacity, critical skill gaps, overload rebalancing, or why specific teams were selected. Every answer is grounded directly in live organizational data.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || queryInput;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/assistant/query', { query: textToSend });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Sorry, I encountered an error communicating with the intelligence service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Which employees best match the Python and AI project?',
    'Who has available capacity for a 20h project?',
    'Which employees are overloaded and how can we rebalance?',
    'Which projects have critical skill shortages?',
    'Why was this team selected?',
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col animate-fade-in">
      {/* Top Header Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-glass border border-white/60 dark:border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 border border-white/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Explainable Workforce AI
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Grounded in Database
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic, audit-ready natural language explanations with zero hallucination.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>Live SQLite / PostgreSQL Sync</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 liquid-glass rounded-3xl p-5 sm:p-6 shadow-glass border border-white/60 dark:border-white/10 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                m.sender === 'user'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 text-white'
              }`}
            >
              {m.sender === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                  : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none backdrop-blur-md'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              <div
                className={`text-[10px] text-right mt-1.5 ${
                  m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 py-2 px-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 w-fit backdrop-blur-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Consulting workforce database and synthesizing scoring breakdowns...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Quick Chips */}
      <div className="flex flex-wrap items-center gap-1.5 shrink-0 px-1">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Suggested:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box in Liquid Glass */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="liquid-glass-card rounded-2xl p-2 border border-white/60 dark:border-white/10 shadow-glass flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Ask a question about employees, projects, capacity, or team trade-offs..."
          className="flex-1 px-4 py-2.5 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!queryInput.trim() || isLoading}
          className="liquid-button-primary px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
