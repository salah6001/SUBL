import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Send, Sparkles, User } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { chatApi } from '@/api/chat';
import { isDemoSession, getDemoChatReply } from '@/lib/demoAuth';
import { toast } from 'sonner';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'Plan My Routine',
  'Suggest Healthy Food',
  'Explain Gut Health',
  'Test My Balance',
  'Build A Habit',
  'Analyze My Mood',
  'Help Me Relax',
  'Summarize A Blog',
];

export default function SubiAI() {
  const { currentUser } = useAppState();
  const msgId = useRef(1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `${greeting}, ${currentUser?.name?.split(' ')[0] || 'there'} 👋\n\nWhere should we start?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: msgId.current++,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const { reply } = isDemoSession() ? getDemoChatReply(text) : await chatApi.send({ message: text });
      setMessages((prev) => [
        ...prev,
        { id: msgId.current++, role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get response');
      setMessages((prev) => [
        ...prev,
        { id: msgId.current++, role: 'assistant', content: 'Sorry, I could not process your request. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <AppLayout title="Subl AI">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-subl-blue-100 text-subl-blue-500' : 'bg-subl-grey-200'
              }`}>
                {msg.role === 'assistant' ? <Sparkles size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-subl-blue-500 text-white rounded-tr-sm'
                  : 'bg-white text-subl-grey-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-subl-blue-100 text-subl-blue-500 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-subl-grey-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-subl-grey-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-subl-grey-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="px-4 py-2 bg-white border border-subl-grey-200 rounded-xl text-sm text-subl-grey-700 hover:border-subl-blue-300 hover:text-subl-blue-500 transition-all shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            placeholder="Ask Subl AI"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-5 pr-14 py-4 bg-white border border-subl-grey-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-subl-blue-200 focus:border-subl-blue-300 shadow-sm transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-subl-blue-500 hover:bg-subl-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
