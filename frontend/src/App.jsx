import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { LogOut, BookOpen, Calendar, LayoutGrid, CheckCircle, Award } from 'lucide-react';

import Auth from './components/Auth';
import GPAWidget from './components/GPAWidget';
import SubjectSection from './components/SubjectSection';
import ScheduleSection from './components/ScheduleSection';
import CalendarView from './components/CalendarView';
import Toast from './components/Toast';
import AIChatWidget from './components/AIChatWidget';


const API_URL = 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('student_planner_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('student_planner_user') || 'null'));
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'calendar'

  // Toast Helpers
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Trigger confetti on high achievements!
    if (type === 'success' && (message.includes('Xuất sắc') || message.includes('Giỏi') || message.includes('10.0') || message.includes('9.'))) {
      triggerConfetti();
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b']
    });
  };

  // Auth Handler
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('student_planner_token');
    localStorage.removeItem('student_planner_user');
    setToken(null);
    setUser(null);
    setSubjects([]);
    setSchedules([]);
    addToast('Đã đăng xuất tài khoản thành công.', 'info');
  };

  // Fetch data
  const fetchData = async () => {
    if (!token) return;

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      // Fetch subjects
      const resSubjects = await axios.get(`${API_URL}/api/subjects`, config);
      setSubjects(resSubjects.data);

      // Fetch schedules
      const resSchedules = await axios.get(`${API_URL}/api/schedules`, config);
      setSchedules(resSchedules.data);
    } catch (error) {
      console.error('Fetch data error:', error);
      if (error.response?.status === 401) {
        handleLogout();
        addToast('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.', 'error');
      } else {
        addToast('Lỗi khi tải dữ liệu từ máy chủ.', 'error');
      }
    }
  };

  // Initial fetch and fetch on token change
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Render Login screen if not authenticated
  if (!token) {
    return (
      <>
        <Auth 
          onAuthSuccess={handleAuthSuccess} 
          addToast={addToast} 
          API_URL={API_URL} 
        />
        {/* Toast Container */}
        <div className="toast-container">
          {toasts.map(toast => (
            <Toast 
              key={toast.id} 
              message={toast.message} 
              type={toast.type} 
              onClose={() => removeToast(toast.id)} 
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      
      {/* Header Bar */}
      <header className="dashboard-header">
        <div className="logo-container">
          <div className="auth-logo" style={{ width: '40px', height: '40px', marginBottom: 0, borderRadius: '10px' }}>
            <BookOpen size={20} color="white" />
          </div>
          <span className="logo-text">Student Planner</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          
          {/* Tab Selection Switches */}
          <div className="schedule-view-selector" style={{ marginBottom: 0 }}>
            <button 
              className={`schedule-view-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LayoutGrid size={16} />
              <span>Bảng Điều Khiển</span>
            </button>
            <button 
              className={`schedule-view-btn ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Calendar size={16} />
              <span>Lịch Tuần Lớp Học</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="user-badge">
              <div className="user-avatar">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.username}</span>
            </div>

            <button 
              onClick={handleLogout}
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Đăng xuất"
            >
              <LogOut size={16} />
              <span style={{ fontSize: '0.85rem' }}>Đăng xuất</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            
            {/* Left Column: GPA Widget & Subject manager */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <GPAWidget subjects={subjects} />
              <SubjectSection 
                subjects={subjects} 
                onSubjectChange={fetchData} 
                addToast={addToast} 
                API_URL={API_URL} 
                token={token} 
              />
            </div>

            {/* Right Column: Schedule manager */}
            <div>
              <ScheduleSection 
                schedules={schedules} 
                subjects={subjects}
                onScheduleChange={fetchData} 
                addToast={addToast} 
                API_URL={API_URL} 
                token={token} 
              />
            </div>

          </div>
        ) : (
          /* Full Width Google Calendar Tab */
          <div style={{ marginTop: '1.5rem' }}>
            <CalendarView schedules={schedules} />
          </div>
        )}
      </main>

      {/* Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>

      {/* AI Chat Assistant Widget */}
      <AIChatWidget 
        token={token} 
        subjects={subjects} 
        schedules={schedules} 
        API_URL={API_URL} 
      />

    </div>
  );
}
