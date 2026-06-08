/* eslint-disable react-hooks/purity */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';

export default function AIChatWidget({ token, API_URL }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Học tập AI của bạn. 🌟 Tôi có thể giúp bạn xem lịch học, phân tích điểm số GPA và đưa ra lời khuyên học tập. Hôm nay bạn cần tôi giúp gì?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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

      // We send the current message and the recent history mapped to the format the server expects
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
        text: '⚠️ Lỗi kết nối tới máy chủ. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  const suggestions = [
    '📅 Lịch học hôm nay thế nào?',
    '📊 Phân tích điểm GPA của tôi',
    '💡 Bí quyết cải thiện điểm số?'
  ];

  return (
    <div className="ai-chat-container">
      {/* Floating Action Button */}
      <button 
        className={`ai-chat-fab ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Trò chuyện với AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        <span className="ai-chat-pulse"></span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window glass-card">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="ai-chat-avatar">
                <Bot size={18} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  AI Assistant <Sparkles size={12} className="glow-text" style={{ color: 'var(--secondary)' }} />
                </h4>
                <span className="ai-chat-status">Trực tuyến</span>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="ai-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-wrapper ${msg.sender}`}>
                {msg.sender === 'ai' && (
                  <div className="ai-message-icon">
                    <Bot size={14} color="white" />
                  </div>
                )}
                <div className={`ai-message-bubble ${msg.sender}`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: line ? '0 0 6px 0' : '8px 0 0 0' }}>
                      {/* Very basic inline markdown bolding rendering for better aesthetics */}
                      {line.split('**').map((part, index) => 
                        index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="ai-message-wrapper ai">
                <div className="ai-message-icon">
                  <Bot size={14} color="white" />
                </div>
                <div className="ai-message-bubble ai typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Chips */}
          <div className="ai-chat-suggestions">
            {suggestions.map((sug, idx) => (
              <button 
                key={idx} 
                className="ai-suggestion-chip"
                onClick={() => handleSendMessage(sug.substring(2))} // remove emoji when sending
                disabled={isLoading}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="ai-chat-input-wrapper">
            <input
              type="text"
              className="form-input ai-chat-input"
              placeholder="Hỏi AI bất kỳ điều gì..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            />
            <button 
              className="btn-icon btn-send-ai" 
              onClick={() => handleSendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
