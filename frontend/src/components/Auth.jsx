import React, { useState } from 'react';
import axios from 'axios';
import { BookOpen, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function Auth({ onAuthSuccess, addToast, API_URL }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('Username and password are required!', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, {
        username: username.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;
      localStorage.setItem('student_planner_token', token);
      localStorage.setItem('student_planner_user', JSON.stringify(user));
      
      addToast(
        isLogin ? `Chào mừng trở lại, ${user.username}! ✨` : 'Đăng ký tài khoản thành công! 🎉', 
        'success'
      );
      
      onAuthSuccess(token, user);
    } catch (error) {
      console.error('Auth error:', error);
      const msg = error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <BookOpen size={28} color="white" />
          </div>
          <h2 className="gradient-text glow-text" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
            Student Planner
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Quản lý môn học và lịch trình biểu học tập
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Đăng Ký
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Tên đăng nhập</label>
            <div style={{ position: 'relative' }}>
              <User 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input 
                id="username"
                type="text" 
                className="form-input" 
                placeholder="Nhập tên đăng nhập..."
                style={{ paddingLeft: '40px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input 
                id="password"
                type="password" 
                className="form-input" 
                placeholder="Nhập mật khẩu..."
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                <span>Đăng Nhập</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Tạo Tài Khoản</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
