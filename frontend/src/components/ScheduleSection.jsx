import { useState } from 'react';
import axios from 'axios';
import { Calendar, Plus, Trash2, Edit2, Clock, MapPin, BookOpen, Check, X } from 'lucide-react';

const WEEKDAYS = [
  { value: 'Monday', label: 'T2' },
  { value: 'Tuesday', label: 'T3' },
  { value: 'Wednesday', label: 'T4' },
  { value: 'Thursday', label: 'T5' },
  { value: 'Friday', label: 'T6' },
  { value: 'Saturday', label: 'T7' },
  { value: 'Sunday', label: 'CN' },
];

export default function ScheduleSection({ 
  schedules, 
  subjects, 
  onScheduleChange, 
  addToast, 
  API_URL, 
  token 
}) {
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // Filter state
  const [selectedDayFilter, setSelectedDayFilter] = useState('All');

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const getDayLabel = (val) => {
    const found = WEEKDAYS.find(d => d.value === val);
    return found ? found.label : val;
  };

  const handleEdit = (sch) => {
    setEditingSchedule(sch);
    setSubjectId(sch.subject_id.toString());
    setDayOfWeek(sch.day_of_week);
    setStartTime(formatTime(sch.start_time));
    setEndTime(formatTime(sch.end_time));
    setRoom(sch.room || '');
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setSubjectId('');
    setDayOfWeek('Monday');
    setStartTime('08:00');
    setEndTime('10:00');
    setRoom('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectId) {
      addToast('Vui lòng chọn môn học!', 'error');
      return;
    }

    if (!dayOfWeek || !startTime || !endTime || !room.trim()) {
      addToast('Vui lòng nhập đầy đủ ngày, giờ và phòng học!', 'error');
      return;
    }

    if (startTime >= endTime) {
      addToast('Giờ kết thúc phải sau giờ bắt đầu!', 'error');
      return;
    }

    try {
      if (editingSchedule) {
        await axios.put(
          `${API_URL}/api/schedules/${editingSchedule.id}`,
          {
            subject_id: parseInt(subjectId, 10),
            day_of_week: dayOfWeek,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            room: room.trim()
          },
          axiosConfig
        );
        addToast('Đã cập nhật lịch học thành công!', 'success');
        handleCancelEdit();
      } else {
        await axios.post(
          `${API_URL}/api/schedules`,
          {
            subject_id: parseInt(subjectId, 10),
            day_of_week: dayOfWeek,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            room: room.trim()
          },
          axiosConfig
        );
        addToast('Đã thêm lịch học thành công!', 'success');
        setSubjectId('');
        setRoom('');
      }
      onScheduleChange();
    } catch (error) {
      console.error('Schedule save error:', error);
      const msg = error.response?.data?.message || 'Không thể lưu lịch học.';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await axios.delete(`${API_URL}/api/schedules/${id}`, axiosConfig);
      addToast(`Đã xóa lịch học môn "${name}"!`, 'success');
      onScheduleChange();
    } catch (error) {
      console.error('Schedule delete error:', error);
      const msg = error.response?.data?.message || 'Không thể xóa lịch học.';
      addToast(msg, 'error');
    }
  };

  const filteredSchedules = selectedDayFilter === 'All' 
    ? schedules 
    : schedules.filter(sch => sch.day_of_week === selectedDayFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Form Card */}
      <div className="glass-card">
        <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} color="var(--secondary)" />
          {editingSchedule ? 'Sửa Lịch Học' : 'Thêm Lịch Học'}
        </h3>

        {subjects.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
            <BookOpen size={24} />
            <p style={{ fontSize: '0.85rem' }}>
              Hãy thêm ít nhất 1 môn học trước khi lập lịch trình học tập!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* Select Subject */}
            <div className="form-group">
              <label className="form-label" htmlFor="sch-subject">Chọn Môn Học</label>
              <select 
                id="sch-subject"
                className="form-input"
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                <option value="">-- Chọn môn học từ danh sách --</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.credit} tín chỉ)
                  </option>
                ))}
              </select>
            </div>

            {/* Weekday Selector */}
            <div className="form-group">
              <label className="form-label">Chọn thứ trong tuần</label>
              <div className="weekday-selector">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`weekday-btn ${dayOfWeek === day.value ? 'active' : ''}`}
                    onClick={() => setDayOfWeek(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start, End, Room Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="sch-start">Bắt đầu</label>
                <input 
                  id="sch-start"
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="sch-end">Kết thúc</label>
                <input 
                  id="sch-end"
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="sch-room">Phòng học</label>
              <input 
                id="sch-room"
                type="text"
                className="form-input"
                placeholder="Ví dụ: P.203, Lab 1..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {editingSchedule ? <Check size={18} /> : <Plus size={18} />}
                <span>{editingSchedule ? 'Cập Nhật' : 'Xác Nhận Lập Lịch'}</span>
              </button>
              {editingSchedule && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancelEdit}
                  style={{ flex: 1 }}
                >
                  <X size={18} />
                  <span>Hủy</span>
                </button>
              )}
            </div>

          </form>
        )}
      </div>

      {/* List Card */}
      <div className="glass-card" style={{ flex: 1 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="gradient-text" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--primary)" />
            Thời Khóa Biểu
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Có <strong>{filteredSchedules.length}</strong> lớp học
          </span>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            type="button" 
            className={`weekday-btn ${selectedDayFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedDayFilter('All')}
            style={{ minWidth: '46px' }}
          >
            TẤT CẢ
          </button>
          {WEEKDAYS.map(day => (
            <button
              key={day.value}
              type="button"
              className={`weekday-btn ${selectedDayFilter === day.value ? 'active' : ''}`}
              onClick={() => setSelectedDayFilter(day.value)}
              style={{ minWidth: '40px' }}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* List of Schedules */}
        <div className="schedule-list" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {filteredSchedules.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} />
              <p style={{ fontSize: '0.9rem' }}>
                {selectedDayFilter === 'All' ? 'Chưa có lịch học nào được thêm.' : 'Không có lớp học nào vào ngày này.'}
              </p>
            </div>
          ) : (
            filteredSchedules.map(sch => (
              <div key={sch.id} className="schedule-card">
                <div className="schedule-card-accent" />
                <div className="schedule-card-body">
                  <span className="schedule-subject">{sch.subject_name}</span>
                  <div className="schedule-time-room">
                    <span className="schedule-badge" style={{ color: 'var(--secondary)' }}>
                      Thứ {getDayLabel(sch.day_of_week) === 'CN' ? 'Nhật' : getDayLabel(sch.day_of_week).replace('T', '')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      {formatTime(sch.start_time)} - {formatTime(sch.end_time)}
                    </span>
                    {sch.room && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                        <MapPin size={14} />
                        {sch.room}
                      </span>
                    )}
                  </div>
                </div>

                <div className="schedule-card-actions" style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleEdit(sch)}
                    className="btn-icon"
                    title="Chỉnh sửa lịch học"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(sch.id, sch.subject_name)}
                    className="btn-icon btn-icon-danger"
                    title="Xóa lịch học"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
