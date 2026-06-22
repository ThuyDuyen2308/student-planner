import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function AIChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Dùng một sessionId cố định cho đơn giản, hoặc có thể tạo mới mỗi lần load trang
  const sessionId = 'session_default';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/ai/chat/${sessionId}`);
        if (res.data.history && res.data.history.length > 0) {
          setMessages(res.data.history);
        } else {
          // Tin nhắn chào mừng mặc định
          setMessages([{ role: 'ai', content: 'Xin chào! Mình là trợ lý học tập AI. Mình có thể giúp gì cho bạn hôm nay?' }]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    
    // Thêm tin nhắn user vào UI lập tức
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { sessionId, message: userMsg });
      setMessages([...newMessages, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'ai', content: 'Xin lỗi, đã xảy ra lỗi kết nối. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bot className="text-blue-400" /> AI Chatbot
        </h1>
        <p className="mt-2 text-slate-400">Trợ lý học tập thông minh 24/7 của bạn.</p>
      </div>

      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col overflow-hidden">
        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-blue-600'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tr-sm' 
                  : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-sm p-4 flex items-center">
                <Loader2 size={18} className="animate-spin text-blue-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
              className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-blue-600 p-3 text-white transition hover:bg-blue-500 disabled:opacity-50 shrink-0"
            >
              <Send size={20} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
