import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  LogOut, 
  BookOpen, 
  Calendar, 
  LayoutGrid, 
  Award, 
  Target, 
  Briefcase, 
  Compass, 
  ListTodo, 
  Menu, 
  X, 
  MessageSquare
} from 'lucide-react';

import Auth from './components/Auth';
import GPAWidget from './components/GPAWidget';
import SubjectSection from './components/SubjectSection';
import ScheduleSection from './components/ScheduleSection';
import CalendarView from './components/CalendarView';
import AssignmentSection from './components/AssignmentSection';
import CareerGoalsSection from './components/CareerGoalsSection';
import CertificatesSection from './components/CertificatesSection';
import InternshipSection from './components/InternshipSection';
import CareerRoadmapSection from './components/CareerRoadmapSection';
import AIChatWidget from './components/AIChatWidget';
import Toast from './components/Toast';

const API_URL = 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('student_planner_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('student_planner_user') || 'null'));
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'assignments', 'goals', 'certificates', 'internship', 'career-roadmap'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
    setAssignments([]);
    setGoals([]);
    setSkills([]);
    setCertificates([]);
    setCompanies([]);
    setInterviews([]);
    setActiveTab('dashboard');
    setChatOpen(false);
    addToast('Đã đăng xuất tài khoản thành công.', 'info');
  };

  // Fetch data
  const fetchData = async () => {
    if (!token) return;

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      // Fetch latest profile details
      const resUser = await axios.get(`${API_URL}/api/auth/me`, config);
      if (resUser.data?.user) {
        setUser(resUser.data.user);
        localStorage.setItem('student_planner_user', JSON.stringify(resUser.data.user));
      }

      // Fetch subjects
      const resSubjects = await axios.get(`${API_URL}/api/subjects`, config);
      setSubjects(resSubjects.data);

      // Fetch schedules
      const resSchedules = await axios.get(`${API_URL}/api/schedules`, config);
      setSchedules(resSchedules.data);

      // Fetch assignments
      const resAssignments = await axios.get(`${API_URL}/api/assignments`, config);
      setAssignments(resAssignments.data);

      // Fetch goals
      const resGoals = await axios.get(`${API_URL}/api/goals`, config);
      setGoals(resGoals.data);

      // Fetch skills
      const resSkills = await axios.get(`${API_URL}/api/skills`, config);
      setSkills(resSkills.data);

      // Fetch certificates
      const resCerts = await axios.get(`${API_URL}/api/certificates`, config);
      setCertificates(resCerts.data);

      // Fetch companies
      const resCompanies = await axios.get(`${API_URL}/api/companies`, config);
      setCompanies(resCompanies.data);

      // Fetch interviews
      const resInterviews = await axios.get(`${API_URL}/api/interviews`, config);
      setInterviews(resInterviews.data);

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

  // Sidebar navigation links definitions
  const navItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: <LayoutGrid size={18} /> },
    { id: 'calendar', label: 'Lịch học', icon: <Calendar size={18} /> },
    { id: 'assignments', label: 'Bài tập & Deadline', icon: <ListTodo size={18} /> },
    { id: 'goals', label: 'Mục tiêu & Kỹ năng', icon: <Target size={18} /> },
    { id: 'certificates', label: 'Chứng chỉ', icon: <Award size={18} /> },
    { id: 'internship', label: 'Thực tập & Việc làm', icon: <Briefcase size={18} /> },
    { id: 'career-roadmap', label: 'Hướng mới (AI Roadmap)', icon: <Compass size={18} /> }
  ];

  return (
    <div className="app-layout">
      
      {/* Sidebar Navigation */}
      <aside className={`sidebar-nav ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="auth-logo" style={{ width: '36px', height: '36px', marginBottom: 0, borderRadius: '8px' }}>
            <BookOpen size={18} color="white" />
          </div>
          <span className="logo-text">Student Planner</span>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar-lg">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-username">{user?.username}</span>
            <span className="user-role">{user?.major || 'Chưa thiết lập ngành học'}</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="sidebar-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="sidebar-footer">
          <button 
            onClick={handleLogout}
            className="sidebar-logout-btn"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-pane">
        
        {/* Mobile Header */}
        <header className="mobile-app-header">
          <button className="menu-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="mobile-header-title">
            {navItems.find(item => item.id === activeTab)?.label}
          </span>
          <div className="user-badge" style={{ padding: '4px' }}>
            <div className="user-avatar" style={{ marginRight: 0 }}>
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Desktop Header Title */}
        <header className="desktop-app-header">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-current">
              {navItems.find(item => item.id === activeTab)?.label}
            </span>
          </div>
          
          <div className="desktop-header-actions">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`btn btn-secondary chat-toggle-header-btn ${chatOpen ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            >
              <MessageSquare size={16} color="var(--primary)" />
              <span>Cố vấn AI</span>
            </button>

            <div className="user-badge">
              <div className="user-avatar">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <span className="user-name-txt">{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="app-main-content">
          {activeTab === 'dashboard' && (
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
          )}

          {activeTab === 'calendar' && (
            <div className="full-width-card card glass animate-fade-in">
              <CalendarView schedules={schedules} />
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="full-width-card card glass animate-fade-in">
              <AssignmentSection 
                assignments={assignments}
                subjects={subjects}
                onAssignmentChange={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="full-width-card card glass animate-fade-in">
              <CareerGoalsSection 
                goals={goals}
                skills={skills}
                onDataChange={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="full-width-card card glass animate-fade-in">
              <CertificatesSection 
                certificates={certificates}
                onCertificateChange={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}

          {activeTab === 'internship' && (
            <div className="full-width-card card glass animate-fade-in">
              <InternshipSection 
                companies={companies}
                interviews={interviews}
                onDataChange={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}

          {activeTab === 'career-roadmap' && (
            <div className="full-width-card card glass animate-fade-in">
              <CareerRoadmapSection 
                user={user}
                onRoadmapGenerated={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}
        </main>
      </div>

      {/* Floating AI Chat Advisor Widget */}
      {chatOpen && (
        <div className="floating-chat-container">
          <div className="chat-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="chat-bot-icon">
                <Compass size={16} color="white" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Trò chuyện cố vấn AI</span>
            </div>
            <button className="chat-close-x-btn" onClick={() => setChatOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="chat-body-wrapper">
            <AIChatWidget token={token} API_URL={API_URL} />
          </div>
        </div>
      )}

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

    </div>
  );
}
