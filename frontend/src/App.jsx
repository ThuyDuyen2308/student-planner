/**
 * App.jsx - Component gốc của ứng dụng Student Planner
 * ----------------------------------------------------------------
 * THAY ĐỔI CHÍNH (feature/dashboard-redesign):
 *   - [CẬP NHẬT GIAO DIỆN] Chuyển từ layout cũ sang kiến trúc
 *     Sidebar (thanh điều hướng bên trái) + Main Content bên phải.
 *   - [MỚI] 5 tab mới: Chứng chỉ, Thực tập, Mục tiêu, Hồ sơ, Admin.
 *   - [MỚI] Quản lý state và fetch dữ liệu cho 5 module mới.
 *   - [MỚI] Kiểm tra role (admin/user) để hiển thị tab Quản trị.
 *   - [MỚI] Hàm handleProfileUpdate để cập nhật user sau khi sửa hồ sơ.
 */
/* eslint-disable react-hooks/purity */
import { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  LogOut, 
  BookOpen, 
  Calendar, 
  LayoutGrid, 
  ListTodo, 
  Award, 
  Briefcase, 
  Target, 
  Bot, 
  User, 
  ShieldAlert 
} from 'lucide-react';

import Auth from './components/Auth';
import GPAWidget from './components/GPAWidget';
import SubjectSection from './components/SubjectSection';
import ScheduleSection from './components/ScheduleSection';
import AssignmentSection from './components/AssignmentSection';
import StatisticsWidget from './components/StatisticsWidget';
import ReminderBanner from './components/ReminderBanner';
import CalendarView from './components/CalendarView';
import Toast from './components/Toast';
import AIChatWidget from './components/AIChatWidget';

// [MỚI] Import các component mới được tạo trong feature này
import CertificatesSection from './components/CertificatesSection';
import InternshipSection from './components/InternshipSection';
import CareerGoalsSection from './components/CareerGoalsSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';

const API_URL = 'http://localhost:5000'; // Địa chỉ máy chủ backend

export default function App() {
  // Lấy token và thông tin user từ localStorage (giữ người dùng đăng nhập sau khi tải lại trang)
  const [token, setToken] = useState(localStorage.getItem('student_planner_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('student_planner_user') || 'null'));
  
  // State các dữ liệu đã có sẵn
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // [MỚI] State cho 5 module mới
  const [certificates, setCertificates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [skills, setSkills] = useState([]);
  
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // Tab đang hiển thị

  // Toast Helpers
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Trigger confetti on high achievements!
    if (type === 'success' && (
      message.includes('Xuất sắc') || 
      message.includes('Giỏi') || 
      message.includes('10.0') || 
      message.includes('9.') ||
      message.includes('thành công')
    )) {
      triggerConfetti();
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b']
    });
  };

  // Auth Handlers
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
    setCertificates([]);
    setCompanies([]);
    setInterviews([]);
    setGoals([]);
    setSkills([]);
    setActiveTab('dashboard');
    addToast('Đã đăng xuất tài khoản thành công.', 'info');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
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

      // Fetch assignments
      const resAssignments = await axios.get(`${API_URL}/api/assignments`, config);
      setAssignments(resAssignments.data);

      // Fetch certificates
      const resCerts = await axios.get(`${API_URL}/api/certificates`, config);
      setCertificates(resCerts.data);

      // Fetch companies
      const resComps = await axios.get(`${API_URL}/api/companies`, config);
      setCompanies(resComps.data);

      // Fetch interviews
      const resInterviews = await axios.get(`${API_URL}/api/interviews`, config);
      setInterviews(resInterviews.data);

      // Fetch career goals
      const resGoals = await axios.get(`${API_URL}/api/goals`, config);
      setGoals(resGoals.data);

      // Fetch skills
      const resSkills = await axios.get(`${API_URL}/api/skills`, config);
      setSkills(resSkills.data);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Sidebar navigation menu options
  const navItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: <LayoutGrid size={18} /> },
    { id: 'calendar', label: 'Lịch học tuần', icon: <Calendar size={18} /> },
    { id: 'tasks', label: 'Công việc cá nhân', icon: <ListTodo size={18} /> },
    { id: 'certificates', label: 'Chứng chỉ học thuật', icon: <Award size={18} /> },
    { id: 'internships', label: 'Thực tập & Việc làm', icon: <Briefcase size={18} /> },
    { id: 'goals', label: 'Mục tiêu & Kỹ năng', icon: <Target size={18} /> },
    { id: 'ai-advisor', label: 'Trợ lý Nghề nghiệp AI', icon: <Bot size={18} /> },
    { id: 'profile', label: 'Thông tin cá nhân', icon: <User size={18} /> },
  ];

  // Insert Admin panel if user is admin
  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Quản trị hệ thống', icon: <ShieldAlert size={18} /> });
  }

  return (
    <div className="app-layout">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container" style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="auth-logo" style={{ width: '36px', height: '36px', marginBottom: 0, borderRadius: '8px' }}>
            <BookOpen size={18} color="white" />
          </div>
          <span className="logo-text" style={{ fontSize: '1.2rem' }}>Student Planner</span>
        </div>

        {/* User Badge Info */}
        <div className="user-profile-summary" style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-avatar" style={{ width: '38px', height: '38px', fontSize: '0.95rem' }}>
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullname || user?.username}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              {user?.role === 'admin' ? 'Administrator' : 'Student'}
            </span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="sidebar-nav" style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                color: activeTab === item.id ? 'white' : 'var(--text-secondary)',
                fontWeight: activeTab === item.id ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Footer */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border-color)',
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '8px',
              color: '#f87171',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-content">
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'capitalize', color: 'white' }}>
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Học kỳ hiện tại • {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}
          </div>
        </header>

        <div className="content-body" style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          
          {/* Dashboard Screen */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ReminderBanner 
                schedules={schedules} 
                assignments={assignments} 
                subjects={subjects} 
              />
              
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

              {/* Statistics Widget */}
              <StatisticsWidget subjects={subjects} assignments={assignments} />
            </div>
          )}

          {/* Calendar Weekly Screen */}
          {activeTab === 'calendar' && (
            <div>
              <CalendarView schedules={schedules} />
            </div>
          )}

          {/* Personal Tasks Screen */}
          {activeTab === 'tasks' && (
            <div>
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

          {/* Certificates Screen */}
          {activeTab === 'certificates' && (
            <div>
              <CertificatesSection 
                certificates={certificates}
                onCertificateChange={fetchData}
                addToast={addToast}
                API_URL={API_URL}
                token={token}
              />
            </div>
          )}

          {/* Internships Screen */}
          {activeTab === 'internships' && (
            <div>
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

          {/* Goals and Skills Screen */}
          {activeTab === 'goals' && (
            <div>
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

          {/* AI Advisor Chat Screen */}
          {activeTab === 'ai-advisor' && (
            <div>
              <AIChatWidget 
                token={token}
                API_URL={API_URL}
              />
            </div>
          )}

          {/* Personal Profile Screen */}
          {activeTab === 'profile' && (
            <div>
              <ProfileSection 
                user={user}
                token={token}
                API_URL={API_URL}
                onProfileUpdate={handleProfileUpdate}
                addToast={addToast}
              />
            </div>
          )}

          {/* Admin Control Screen */}
          {activeTab === 'admin' && user?.role === 'admin' && (
            <div>
              <AdminSection 
                token={token}
                API_URL={API_URL}
                addToast={addToast}
              />
            </div>
          )}

        </div>
      </div>

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
