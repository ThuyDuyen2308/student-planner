import { useState, useEffect } from 'react';
import { BellRing, AlertTriangle, Sparkles, X, ChevronRight, BookOpen, Clock } from 'lucide-react';

export default function ReminderBanner({ schedules, assignments, subjects }) {
  const [reminders, setReminders] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkReminders = () => {
      const activeReminders = [];
      const now = new Date();

      // --- 1. CHECK FOR UPCOMING SCHEDULES TODAY ---
      const weekdaysMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday'
      };
      
      const todayEnglish = weekdaysMap[now.getDay()];
      const todaySchedules = schedules.filter(sch => sch.day_of_week === todayEnglish);

      todaySchedules.forEach(sch => {
        // Parse start_time (e.g. "08:30:00" or "08:30")
        const [hours, minutes] = sch.start_time.split(':').map(Number);
        const schDate = new Date(now);
        schDate.setHours(hours, minutes, 0, 0);

        const diffMs = schDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // If class starts in the future, within next 3 hours
        if (diffHours > 0 && diffHours <= 3) {
          const diffMins = Math.round(diffMs / (1000 * 60));
          activeReminders.push({
            id: `sch-${sch.id}`,
            type: 'schedule',
            title: `Lịch học sắp diễn ra`,
            message: `Bạn có tiết học môn "${sch.subject_name}" lúc ${sch.start_time.substring(0, 5)} (còn khoảng ${diffMins} phút) ${sch.room ? `tại phòng ${sch.room}` : ''}.`,
            color: 'var(--secondary)'
          });
        }
      });

      // --- 2. CHECK FOR DEADLINES IN THE NEXT 24 HOURS ---
      assignments.forEach(assign => {
        if (assign.status === 'completed') return;

        const targetDate = new Date(assign.deadline);
        const diffMs = targetDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Overdue deadline
        if (diffMs < 0 && Math.abs(diffHours) <= 24) {
          activeReminders.push({
            id: `assign-over-${assign.id}`,
            type: 'overdue',
            title: `Bài tập trễ hạn!`,
            message: `Hạn nộp bài "${assign.title}" đã qua lúc ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay.`,
            color: 'var(--danger)'
          });
        }
        // Upcoming deadline within 24 hours
        else if (diffHours > 0 && diffHours <= 24) {
          const hoursLeft = Math.floor(diffHours);
          const minsLeft = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          let timeLeftText = '';
          if (hoursLeft > 0) {
            timeLeftText = `${hoursLeft} giờ ${minsLeft} phút`;
          } else {
            timeLeftText = `${minsLeft} phút`;
          }

          activeReminders.push({
            id: `assign-${assign.id}`,
            type: 'deadline',
            title: `Hạn nộp sắp hết!`,
            message: `Bài tập "${assign.title}" sẽ hết hạn sau ${timeLeftText} nữa (lúc ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}). Hãy hoàn thành ngay nhé!`,
            color: 'hsl(35, 100%, 55%)'
          });
        }
      });

      // --- 3. MOTIVATIONAL ALERTS BASED ON GPA AND PROGRESS ---
      const gradedSubjects = subjects.filter(sub => sub.status === 'completed' && sub.score !== null);
      const gradedCredits = gradedSubjects.reduce((sum, sub) => sum + sub.credit, 0);

      const getGradePoint4 = (score) => {
        const s = parseFloat(score);
        if (s >= 9.0) return 4.0;
        if (s >= 8.5) return 3.7;
        if (s >= 8.0) return 3.5;
        if (s >= 7.0) return 3.0;
        if (s >= 6.5) return 2.5;
        if (s >= 6.0) return 2.0;
        if (s >= 5.0) return 1.5;
        if (s >= 4.0) return 1.0;
        return 0.0;
      };

      const weightedScoreSum4 = gradedSubjects.reduce((sum, sub) => sum + (getGradePoint4(sub.score) * sub.credit), 0);
      const gpa4 = gradedCredits > 0 ? (weightedScoreSum4 / gradedCredits) : 0;

      if (activeReminders.length === 0) {
        if (gpa4 >= 3.2 && gradedCredits > 0) {
          activeReminders.push({
            id: 'motivation-gpa',
            type: 'motivation',
            title: 'Học tập xuất sắc',
            message: `Tuyệt vời! Bạn đang duy trì điểm trung bình GPA là ${gpa4.toFixed(2)}/4.0. Tiếp tục giữ vững phong độ đỉnh cao này nhé! ✨`,
            color: 'var(--success)'
          });
        } else if (gpa4 > 0 && gpa4 < 2.5 && gradedCredits > 0) {
          activeReminders.push({
            id: 'motivation-gpa-low',
            type: 'motivation',
            title: 'Cố gắng lên nào!',
            message: `GPA tích lũy hiện tại là ${gpa4.toFixed(2)}/4.0. Đặt mục tiêu làm bài tập đầy đủ để bứt phá điểm số trong kỳ này nhé! 💪`,
            color: 'hsl(35, 100%, 55%)'
          });
        } else if (todaySchedules.length === 0 && assignments.filter(a => a.status === 'pending').length === 0) {
          activeReminders.push({
            id: 'rest-day',
            type: 'motivation',
            title: 'Thư giãn một chút',
            message: `Hôm nay bạn không có lịch học hay deadline bài tập nào gấp. Hãy dành thời gian nghỉ ngơi hoặc đọc sách nhé! 🍃`,
            color: 'var(--primary)'
          });
        } else {
          activeReminders.push({
            id: 'daily-motivate',
            type: 'motivation',
            title: 'Chào ngày mới!',
            message: `Hôm nay bạn có ${todaySchedules.length} tiết học và ${assignments.filter(a => a.status === 'pending').length} bài tập cần làm. Chúc bạn có một ngày học tập thật hiệu quả! 🚀`,
            color: 'var(--primary)'
          });
        }
      }

      setReminders(activeReminders);
    };

    checkReminders();
    // Re-check reminders every 60 seconds
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [schedules, assignments, subjects]);

  if (dismissed || reminders.length === 0) return null;

  // Render the first active reminder (priority: overdue > deadline > schedule > motivation)
  const sortedReminders = [...reminders].sort((a, b) => {
    const priority = { overdue: 1, deadline: 2, schedule: 3, motivation: 4 };
    return priority[a.type] - priority[b.type];
  });

  const currentReminder = sortedReminders[0];

  const getIcon = (type) => {
    switch (type) {
      case 'overdue':
      case 'deadline':
        return <AlertTriangle size={20} color="white" />;
      case 'schedule':
        return <BellRing size={20} color="white" className="notification-bell-anim" />;
      case 'motivation':
      default:
        return <Sparkles size={20} color="white" />;
    }
  };

  const getBackground = (type) => {
    switch (type) {
      case 'overdue':
        return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
      case 'deadline':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'schedule':
        return 'linear-gradient(135deg, var(--secondary) 0%, #0891b2 100%)';
      case 'motivation':
      default:
        return 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)';
    }
  };

  return (
    <div 
      className="reminder-banner-container"
      style={{ 
        background: getBackground(currentReminder.type),
        color: 'white',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'slideDown 0.4s ease-out'
      }}
    >
      {/* Decorative glowing circles */}
      <div style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', top: '-50px', right: '-30px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.03)', bottom: '-20px', left: '20%', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1, flex: 1, minWidth: 0 }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: '10px', 
          width: '40px', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {getIcon(currentReminder.type)}
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', tracking: '0.05em', opacity: 0.9, display: 'block' }}>
            {currentReminder.title}
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.4 }}>
            {currentReminder.message}
          </p>
        </div>
      </div>

      <button 
        onClick={() => setDismissed(true)}
        style={{ 
          background: 'rgba(255, 255, 255, 0.15)', 
          border: 'none', 
          borderRadius: '50%', 
          width: '28px', 
          height: '28px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          cursor: 'pointer',
          transition: 'all 0.2s',
          zIndex: 1,
          flexShrink: 0
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
        title="Đóng thông báo"
      >
        <X size={16} />
      </button>
    </div>
  );
}
