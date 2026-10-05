import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Lock,
  ShieldCheck,
  User,
  HelpCircle,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { aiApi, type AiAssistantResponse } from '../services/aiApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  dataUsed?: AiAssistantResponse['dataUsed'];
}

export const AIAssistantPage: React.FC = () => {
  const messageIdCounter = useRef(100);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_01',
      sender: 'assistant',
      text: 'Hello! I am your FinShield Secure AI Financial Advisor. I analyze your securely scoped financial data to answer questions about your spending, budgets, and savings. You can ask me about your expenses, specific categories, budget limits, or recent transactions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleQuestions = [
    'How much did I spend this month?',
    'What is my highest spending category?',
    'Am I close to exceeding any budget?',
    'How much income did I receive this month?',
    'What were my recent expenses?',
    'Explain my latest scam alert',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    messageIdCounter.current += 1;
    const userMsgId = `usr_${messageIdCounter.current}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiApi.ask(trimmed);
      messageIdCounter.current += 1;
      const asstMsgId = `asst_${messageIdCounter.current}`;

      const assistantMsg: ChatMessage = {
        id: asstMsgId,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataUsed: response.dataUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to retrieve AI analysis';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1424] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">Tenant Isolated</Badge>
            <Badge variant="teal">Neon PostgreSQL Backed</Badge>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-400" /> FinShield AI Financial Advisor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Conversational analysis scoped strictly to your authenticated ledger records. Secrets and database credentials remain 100% server-side.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 flex items-center gap-2.5 text-xs font-mono text-cyan-300">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Server-Scoped Tool Broker Architecture</span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Inquiries:
        </p>
        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(q)}
              className="px-3.5 py-2 rounded-xl bg-[#0c1322] border border-slate-800 hover:border-cyan-500/60 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/80 flex items-center gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Window Shell */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950'
                    : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}
              >
                {m.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-950/80 to-teal-950/80 text-cyan-100 border border-cyan-800/60 rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {/* Structured Metadata Badge (if available) */}
                {m.dataUsed && m.dataUsed.period && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Database className="w-3 h-3" /> {m.dataUsed.period}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-teal-400">
                      <Layers className="w-3 h-3" /> {m.dataUsed.transactionCount} txs analyzed
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">Provider: {m.dataUsed.provider}</span>
                  </div>
                )}

                <span className="block text-[10px] text-slate-500 font-mono text-right">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-teal-400 border border-slate-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-slate-900/90 text-slate-300 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Analyzing your securely scoped financial data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Shell */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputMessage);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              disabled={isLoading}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask questions about your spending, budget limits, or savings..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 rounded-xl font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Analyzes your securely scoped financial records via verified backend controls; zero credential leaks.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
