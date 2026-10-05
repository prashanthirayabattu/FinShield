import React, { useState, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Lock,
  ShieldCheck,
  User,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '../components/Badge';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const messageIdCounter = useRef(100);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_01',
      sender: 'assistant',
      text: 'Hello Surya! I am your FinShield AI Assistant. I can analyze your financial trends, evaluate category budget utilization, and highlight anomalies. Note: In Phase 1, I am running in UI demonstration mode with pre-configured responses.',
      timestamp: '18:20',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const exampleQuestions = [
    'Where am I spending the most?',
    'How much did I spend on food?',
    'How is this month compared with last month?',
    'Suggest a budget for next month.',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    messageIdCounter.current += 1;
    const currentId = `usr_${messageIdCounter.current}`;
    const userMsg: ChatMessage = {
      id: currentId,
      sender: 'user',
      text: text.trim(),
      timestamp: '18:25',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Pre-calculated context-aware answer for demo questions
    setTimeout(() => {
      let reply: string;
      if (text.includes('most')) {
        reply = 'Based on your ledger records, your highest spending category this month is Food (₹6,850.00 across 3 purchases), accounting for approximately 42% of your total expenses.';
      } else if (text.includes('food')) {
        reply = 'You have spent ₹6,850.00 on Food this month. Your budget cap for Food is ₹8,000.00, meaning you have utilized 85.6% of your allocation (80% alert threshold active).';
      } else if (text.includes('last month')) {
        reply = 'Compared to last month, your discretionary expenses are down 4.2%, but your Bills category exceeded its limit by ₹350.00 due to utility bill adjustments.';
      } else if (text.includes('budget')) {
        reply = 'Recommendation for next month: Consider increasing your Food allocation to ₹8,500.00 while reducing Entertainment to ₹2,000.00 to preserve your 75%+ savings target.';
      } else {
        reply = `Thank you for your inquiry regarding "${text}". In Phase 3, this query will be processed through our server-side LLM proxy with authorized, redacted financial context.`;
      }

      messageIdCounter.current += 1;
      const assistantMsg: ChatMessage = {
        id: `asst_${messageIdCounter.current}`,
        sender: 'assistant',
        text: reply,
        timestamp: '18:25',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a1424] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan">Context-Isolated AI</Badge>
            <Badge variant="teal">Zero Key Exposure</Badge>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-400" /> FinShield AI Financial Advisor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Conversational analysis scoped strictly to your authenticated ledger. Vendor API keys remain 100% server-side.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 flex items-center gap-2.5 text-xs font-mono text-cyan-300">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Server Broker Architecture (ADR-005)</span>
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
              onClick={() => handleSend(q)}
              className="px-3.5 py-2 rounded-xl bg-[#0c1322] border border-slate-800 hover:border-cyan-500/60 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left flex items-center gap-2 shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window Shell */}
      <div className="bg-[#0c1322] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[480px]">
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
                className={`max-w-[78%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-950/80 to-teal-950/80 text-cyan-100 border border-cyan-800/60 rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
                <span className="block mt-1.5 text-[10px] text-slate-500 font-mono text-right">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}
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
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask questions about your spending, categories, or savings..."
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="p-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 rounded-xl font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>
              Real-time API integration with Gemini / OpenAI activates in Phase 3.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
