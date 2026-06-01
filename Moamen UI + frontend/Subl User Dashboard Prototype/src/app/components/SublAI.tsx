import { useState, useRef, useEffect } from "react";
import {
  Send,
  Calendar,
  BarChart2,
  Wind,
  Target,
  Activity,
  FileText,
  Brain,
  Loader2,
  User,
  Sparkles,
} from "lucide-react";
import { initialChatMessages, promptChips, aiResponses } from "../data/mockData";
import { chatApi } from "../api/chat";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const chipIcons: Record<string, typeof Calendar> = {
  Calendar, BarChart2, Wind, Target, Activity, FileText,
};

function fmt(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return (
        <span key={i} className="flex items-start gap-2 mt-1">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        </span>
      );
    }
    if (/^\*\*[^*]+\*\*$/.test(line.trim()) && !line.includes(" ")) {
      return <strong key={i} className="block mt-2 mb-0.5">{line.replace(/\*\*/g, "")}</strong>;
    }
    if (line === "---") return <hr key={i} className="my-2 border-current opacity-10" />;
    return (
      <span key={i}>
        <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
        <br />
      </span>
    );
  });
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-0.5 ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : "bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Brain className="w-3.5 h-3.5 text-white" />}
      </div>
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm"
          }`}
        >
          {renderContent(msg.content)}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-600 px-1">{fmt(msg.timestamp)}</span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shrink-0">
        <Brain className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function genResponse(input: string): string {
  const l = input.toLowerCase();
  if (l.includes("stress") || l.includes("anxious"))
    return "I hear you. Stress at work is something many people face, and recognizing it is the first step.\n\nBased on your current stress score of 34/100, you're in a manageable range today. Here are three quick things you can do right now:\n\n• Take 3 deep breaths using the 4-7-8 technique\n• Step away from your screen for 5 minutes\n• Drink a glass of water — dehydration amplifies cortisol\n\nWould you like me to guide you through a relaxation exercise?";
  if (l.includes("sleep") || l.includes("tired"))
    return "Sleep quality directly impacts stress resilience. Based on your typing patterns today, there are signs of mild cognitive fatigue.\n\n**Quick wins for tonight:**\n• Avoid screens 60 minutes before bed\n• Keep your room at 65–68°F (18–20°C)\n• Try the 10-3-2-1-0 protocol\n\nYour data shows that on days you logged 7+ hours, your stress score was 23% lower. Want me to set a sleep reminder?";
  if (l.includes("focus") || l.includes("concentrate"))
    return "I analyzed your focus patterns today. Your peak cognitive window is **9:00–11:30 AM** when typing fluency is highest.\n\n**For right now:**\n• Close all non-essential tabs\n• Put your phone face-down\n• Set a 52-minute focus timer\n• Use 40Hz binaural beats if your environment is noisy\n\nWant me to schedule a focus block on your calendar?";
  return `Thanks for sharing that, Alex. Based on your wellness data today, your stress is at 34/100 — a healthy range.\n\nIf you'd like specific guidance, try asking me to:\n• **"Analyze My Mood"** — detailed emotional breakdown\n• **"Plan My Routine"** — optimized daily schedule\n• **"Help Me Relax"** — guided relaxation exercise\n\nIs there anything specific you'd like to explore?`;
}

export function SublAI() {
  const [messages, setMessages] = useState<Message[]>(initialChatMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || isTyping) return;
    setMessages((p) => [...p, { id: `u${Date.now()}`, role: "user", content: t, timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);
    try {
      const { reply } = await chatApi.send(t);
      setMessages((p) => [...p, { id: `a${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() }]);
    } catch {
      // Fallback to local responses if API is unavailable
      const chipKey = promptChips.find((c) => c.label === t)?.label;
      const reply = aiResponses[chipKey ?? ""] ?? genResponse(t);
      setMessages((p) => [...p, { id: `a${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    /* Outer centering wrapper */
    <div className="flex justify-center">
      <div className="w-full max-w-5xl flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Chat window */}
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800 dark:text-slate-200">Subl AI Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] text-green-600 dark:text-green-400">Online · Monitoring active</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Subl AI
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Prompt chips */}
          <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {promptChips.map((chip) => {
                const Icon = chipIcons[chip.icon] ?? Activity;
                return (
                  <button
                    key={chip.id}
                    onClick={() => send(chip.label)}
                    disabled={isTyping}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs whitespace-nowrap transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
                placeholder="Ask Subl AI anything about your wellness..."
                disabled={isTyping}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md shadow-blue-600/25"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 text-center">
              All conversations are private and encrypted. Data never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
