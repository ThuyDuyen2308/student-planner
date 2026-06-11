import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, Sparkles, Target, Award, Compass, CalendarRange, Trash2 } from 'lucide-react';

export default function AIChatWidget({ token, API_URL }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là **AI Career Advisor (Cố vấn nghề nghiệp AI)** của bạn. 🌟\n\nTôi đã được kết nối với toàn bộ dữ liệu học tập, mục tiêu nghề nghiệp, kỹ năng hiện có, chứng chỉ học thuật và các chiến dịch ứng tuyển thực tập của bạn.\n\nHôm nay bạn cần tôi đưa ra lời khuyên gì? Hãy chọn nhanh các hành động bên dưới hoặc nhập câu hỏi trực tiếp nhé!'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const chatHistory = messages
        .filter(msg => msg.id !== 1) // exclude welcome message
        .map(msg => ({
          sender: msg.sender,
          text: msg.text
        }));

      const response = await axios.post(`${API_URL}/api/chat`, {
        message: textToSend.trim(),
        history: chatHistory
      }, config);

      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.data.reply
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: '⚠️ Lỗi kết nối tới cố vấn AI. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có muốn xóa lịch sử trò chuyện này không?')) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: 'Lịch sử trò chuyện đã được làm sạch. Tôi có thể giúp gì thêm cho lộ trình học tập và nghề nghiệp của bạn?'
        }
      ]);
    }
  };

  const quickPrompts = [
    {
      title: 'Lộ trình nghề nghiệp',
      desc: 'Tư vấn học tập theo mục tiêu đã đề ra',
      prompt: 'Gợi ý lộ trình học tập cụ thể dựa trên mục tiêu nghề nghiệp hiện tại của tôi',
      icon: <Compass size={18} style={{ color: 'var(--primary)' }} />
    },
    {
      title: 'Bồi dưỡng kỹ năng',
      desc: 'Kỹ năng cần có để cải thiện CV',
      prompt: 'Phân tích bản đồ kỹ năng của tôi và gợi ý các kỹ năng mới cần bồi dưỡng thêm',
      icon: <Target size={18} style={{ color: 'var(--accent)' }} />
    },
    {
      title: 'Đề xuất chứng chỉ',
      desc: 'Các chứng chỉ học thuật nên thi',
      prompt: 'Tôi nên ôn thi và lấy thêm các chứng chỉ ngoại ngữ hay chuyên môn nào?',
      icon: <Award size={18} style={{ color: 'var(--secondary)' }} />
    },
    {
      title: 'Kế hoạch thời gian',
      desc: 'Cân bằng học, thi và thực tập',
      prompt: 'Hãy đề xuất kế hoạch phân bổ thời gian học tập, thi chứng chỉ và thực tập tối ưu nhất cho tôi',
      icon: <CalendarRange size={18} style={{ color: 'var(--success)' }} />
    }
  ];

  // Helper to parse double asterisks and bullet points
  const renderMessageContent = (text) => {
    return text.split('\n').map((line, idx) => {
      // Check if line is bullet point
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      let cleanLine = isBullet ? line.trim().substring(2) : line;

      // Handle bolding
      const parts = cleanLine.split('**');
      const renderedParts = parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} style={{ color: 'var(--secondary)', fontWeight: 700 }}>{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '4px', listStyleType: 'disc' }}>
            {renderedParts}
          </li>
        );
      }

      return (
        <p key={idx} style={{ margin: line ? '0 0 10px 0' : '12px 0 0 0', minHeight: line ? 'auto' : '10px' }}>
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
      
      {/* Sidebar - Quick Prompts */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
            <span>Gợi ý hành động nhanh</span>
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Bấm để gửi yêu cầu tư vấn nhanh đến Cố vấn AI
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              className="quick-action-card"
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>{qp.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>{qp.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{qp.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleClearHistory}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
        >
          <Trash2 size={16} />
          <span>Làm sạch cuộc trò chuyện</span>
        </button>
      </div>

      {/* Main Conversation Window */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="auth-logo" style={{ width: '36px', height: '36px', margin: 0, borderRadius: '6px', background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                AI Career Advisor (Cố vấn nghề nghiệp)
                <Sparkles size={12} className="glow-text" style={{ color: 'var(--secondary)' }} />
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }}></span>
                Trực tuyến & Sẵn sàng hỗ trợ
              </span>
            </div>
          </div>
        </div>

        {/* Chat Feed */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
              <div style={{ display: 'flex', gap: '10px', maxWidth: '80%', alignItems: 'flex-start', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                {msg.sender === 'ai' && (
                  <div className="auth-logo" style={{ width: '28px', height: '28px', margin: 0, borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                    <Bot size={14} color="var(--secondary)" />
                  </div>
                )}
                <div
                  className={`ai-message-bubble ${msg.sender}`}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    border: '1px solid ' + (msg.sender === 'user' ? 'transparent' : 'var(--border-color)'),
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {renderMessageContent(msg.text)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="auth-logo" style={{ width: '28px', height: '28px', margin: 0, borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                  <Bot size={14} color="var(--secondary)" />
                </div>
                <div className="ai-message-bubble ai typing" style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
            <textarea
              className="form-input"
              rows="1"
              placeholder="Nhập câu hỏi của bạn về kỹ năng, chứng chỉ, lộ trình nghề nghiệp hay thực tập..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              style={{
                padding: '12px 60px 12px 16px',
                borderRadius: '8px',
                resize: 'none',
                minHeight: '46px',
                height: '46px',
                lineHeight: '1.4',
                fontFamily: 'inherit',
                flex: 1
              }}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '34px',
                height: '34px',
                minWidth: 'auto',
                padding: 0,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
