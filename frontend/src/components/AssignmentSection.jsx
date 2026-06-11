import { useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle, FileText, Plus, Edit2, Trash2, Check, X, Search, ArrowUpDown, ListTodo } from 'lucide-react';

export default function AssignmentSection({ 
  assignments, 
  subjects, 
  onAssignmentChange, 
  addToast, 
  API_URL, 
  token 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // pending, completed, overdue, All
  const [sortBy, setSortBy] = useState('asc'); // asc, desc

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleEdit = (assign) => {
    setEditingAssignment(assign);
    setTitle(assign.title);
    setDescription(assign.description || '');
    if (assign.deadline) {
      const date = new Date(assign.deadline);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      setDeadline(localISOTime);
    } else {
      setDeadline('');
    }
    setSubjectId(assign.subject_id ? assign.subject_id.toString() : '');
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setTitle('');
    setDescription('');
    setDeadline('');
    setSubjectId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !deadline) {
      addToast('Vui lòng điền đầy đủ tiêu đề và deadline!', 'error');
      return;
    }

    try {
      if (editingAssignment) {
        await axios.put(
          `${API_URL}/api/assignments/${editingAssignment.id}`,
          {
            title: title.trim(),
            description: description.trim() || null,
            deadline: deadline.replace('T', ' ') + ':00',
            subject_id: subjectId ? parseInt(subjectId, 10) : null,
            status: editingAssignment.status
          },
          axiosConfig
        );
        addToast('Cập nhật công việc thành công!', 'success');
        handleCancelEdit();
      } else {
        await axios.post(
          `${API_URL}/api/assignments`,
          {
            title: title.trim(),
            description: description.trim() || null,
            deadline: deadline.replace('T', ' ') + ':00',
            subject_id: subjectId ? parseInt(subjectId, 10) : null
          },
          axiosConfig
        );
        addToast('Thêm công việc cá nhân thành công!', 'success');
        setTitle('');
        setDescription('');
        setDeadline('');
        setSubjectId('');
      }
      onAssignmentChange();
    } catch (error) {
      console.error('Assignment save error:', error);
      const msg = error.response?.data?.message || 'Không thể lưu công việc.';
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/api/assignments/${id}`, axiosConfig);
      addToast(`Đã xóa công việc "${name}"!`, 'success');
      onAssignmentChange();
    } catch (error) {
      console.error('Assignment delete error:', error);
      const msg = error.response?.data?.message || 'Không thể xóa công việc.';
      addToast(msg, 'error');
    }
  };

  const toggleStatus = async (assign) => {
    const newStatus = assign.status === 'completed' ? 'pending' : 'completed';
    try {
      await axios.patch(
        `${API_URL}/api/assignments/${assign.id}/status`,
        { status: newStatus },
        axiosConfig
      );
      addToast(
        newStatus === 'completed' 
          ? `Chúc mừng! Bạn đã hoàn thành "${assign.title}".` 
          : `Đã đánh dấu chưa hoàn thành cho "${assign.title}".`,
        'success'
      );
      onAssignmentChange();
    } catch (error) {
      console.error('Toggle status error:', error);
      addToast('Lỗi khi cập nhật trạng thái công việc.', 'error');
    }
  };

  const getCountdown = (deadlineStr, status) => {
    if (status === 'completed') return { text: 'Đã hoàn thành', type: 'completed' };
    
    const now = new Date();
    const target = new Date(deadlineStr);
    const diffMs = target - now;

    if (diffMs < 0) {
      const absDiff = Math.abs(diffMs);
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      if (days > 0) return { text: `Quá hạn ${days} ngày`, type: 'overdue' };
      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      if (hours > 0) return { text: `Quá hạn ${hours} giờ`, type: 'overdue' };
      return { text: 'Vừa quá hạn', type: 'overdue' };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { text: `Còn ${days} ngày ${hours} giờ`, type: days <= 1 ? 'critical' : 'normal' };
    }
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return { text: `Còn ${hours} giờ ${mins} phút`, type: 'critical' };
    }
    return { text: `Còn ${mins} phút nữa!`, type: 'critical' };
  };

  // Calculate statistics
  const now = new Date();
  const totalTasks = assignments.length;
  const completedTasks = assignments.filter(a => a.status === 'completed').length;
  const pendingTasks = assignments.filter(a => a.status === 'pending' && new Date(a.deadline) >= now).length;
  const overdueTasks = assignments.filter(a => a.status === 'pending' && new Date(a.deadline) < now).length;

  const filteredAssignments = assignments
    .filter(assign => {
      const matchesSearch = assign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (assign.description && assign.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const isOverdue = new Date(assign.deadline) < now && assign.status !== 'completed';

      if (statusFilter === 'pending') {
        return matchesSearch && assign.status === 'pending' && !isOverdue;
      }
      if (statusFilter === 'completed') {
        return matchesSearch && assign.status === 'completed';
      }
      if (statusFilter === 'overdue') {
        return matchesSearch && isOverdue;
      }
      return matchesSearch; // 'All'
    })
    .sort((a, b) => {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      return sortBy === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Statistics Cards Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tổng công việc</span>
          <strong style={{ fontSize: '1.5rem', color: 'white' }}>{totalTasks}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Đã hoàn thành</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{completedTasks}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Đang thực hiện</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>{pendingTasks}</strong>
        </div>
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quá hạn</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>{overdueTasks}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem' }}>
        
        {/* Form Card */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListTodo size={20} color="var(--secondary)" />
            {editingAssignment ? 'Sửa công việc' : 'Thêm công việc cá nhân'}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="assign-title">Tiêu đề công việc</label>
              <input 
                id="assign-title"
                type="text"
                className="form-input"
                placeholder="Ví dụ: Nộp báo cáo cuối kỳ, chuẩn bị CV..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assign-subject">Môn học liên quan (Tùy chọn)</label>
              <select 
                id="assign-subject"
                className="form-input"
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">-- Không liên quan --</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="assign-deadline">Hạn nộp (Deadline)</label>
              <input 
                id="assign-deadline"
                type="datetime-local"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="assign-desc">Mô tả chi tiết / Ghi chú</label>
              <textarea 
                id="assign-desc"
                className="form-input"
                placeholder="Yêu cầu công việc, link tài liệu..."
                rows="3"
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', paddingTop: '8px' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                {editingAssignment ? <Check size={18} /> : <Plus size={18} />}
                <span>{editingAssignment ? 'Cập Nhật' : 'Thêm Công Việc'}</span>
              </button>
              {editingAssignment && (
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
        </div>

        {/* List Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className="gradient-text" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--primary)" />
              Danh sách công việc
            </h3>
            <button 
              type="button"
              className="btn-icon"
              onClick={() => setSortBy(prev => prev === 'asc' ? 'desc' : 'asc')}
              title="Đảo chiều sắp xếp thời gian"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem', height: 'auto', borderRadius: '6px' }}
            >
              <ArrowUpDown size={12} />
              <span>Thời gian: {sortBy === 'asc' ? 'Tăng' : 'Giảm'}</span>
            </button>
          </div>

          {/* Search */}
          <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text"
              className="form-input search-input"
              placeholder="Tìm kiếm công việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filters Bar */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
            <button 
              type="button" 
              className={`weekday-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: '90px' }}
            >
              Chưa xong
            </button>
            <button 
              type="button" 
              className={`weekday-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: '90px' }}
            >
              Hoàn thành
            </button>
            <button 
              type="button" 
              className={`weekday-btn ${statusFilter === 'overdue' ? 'active' : ''}`}
              onClick={() => setStatusFilter('overdue')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: '80px', color: statusFilter === 'overdue' ? 'var(--danger)' : 'inherit' }}
            >
              Quá hạn
            </button>
            <button 
              type="button" 
              className={`weekday-btn ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', minWidth: '60px' }}
            >
              Tất cả
            </button>
          </div>

          {/* List of tasks */}
          <div className="assignment-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
            {filteredAssignments.length === 0 ? (
              <div className="empty-state">
                <FileText size={36} />
                <p style={{ fontSize: '0.9rem' }}>
                  {statusFilter === 'pending' && 'Tuyệt vời! Không có công việc nào chưa hoàn thành.'}
                  {statusFilter === 'completed' && 'Bạn chưa hoàn thành công việc nào.'}
                  {statusFilter === 'overdue' && 'Tuyệt vời! Không có công việc nào quá hạn.'}
                  {statusFilter === 'All' && 'Chưa có công việc nào được thêm.'}
                </p>
              </div>
            ) : (
              filteredAssignments.map(assign => {
                const countdown = getCountdown(assign.deadline, assign.status);
                return (
                  <div key={assign.id} className={`assignment-card ${assign.status === 'completed' ? 'completed' : ''}`}>
                    <button 
                      className="assignment-checkbox"
                      onClick={() => toggleStatus(assign)}
                      title={assign.status === 'completed' ? 'Đánh dấu chưa làm' : 'Đánh dấu đã hoàn thành'}
                    >
                      {assign.status === 'completed' ? (
                        <CheckCircle2 size={20} color="var(--success)" style={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                      ) : (
                        <Circle size={20} color="var(--text-muted)" />
                      )}
                    </button>

                    <div className="assignment-details" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="assignment-title" style={{ textDecoration: assign.status === 'completed' ? 'line-through' : 'none', color: assign.status === 'completed' ? 'var(--text-muted)' : 'var(--text-color)' }}>
                          {assign.title}
                        </span>
                        {assign.subject_name && (
                          <span className="assignment-subject-tag">
                            {assign.subject_name}
                          </span>
                        )}
                      </div>
                      {assign.description && (
                        <p className="assignment-desc" style={{ textDecoration: assign.status === 'completed' ? 'line-through' : 'none' }}>
                          {assign.description}
                        </p>
                      )}
                      
                      <div className="assignment-footer" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.75rem', flexWrap: 'wrap' }}>
                        <span className="assignment-date" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(assign.deadline).toLocaleString('vi-VN', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'numeric', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        
                        {/* Countdown badge */}
                        <span 
                          className={`countdown-badge ${countdown.type}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {countdown.type === 'overdue' && <AlertCircle size={10} />}
                          {countdown.type === 'completed' && <Check size={10} />}
                          {countdown.text}
                        </span>
                      </div>
                    </div>

                    <div className="assignment-actions" style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => handleEdit(assign)}
                        className="btn-icon"
                        title="Sửa công việc"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => handleDelete(assign.id, assign.title)}
                        className="btn-icon btn-icon-danger"
                        title="Xóa công việc"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
