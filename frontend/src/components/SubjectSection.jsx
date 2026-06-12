import { useState } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, Edit2, Check, X, AlertTriangle, BookOpen } from 'lucide-react';

export default function SubjectSection({ subjects, onSubjectChange, addToast, API_URL, token }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('completed');
  const [editingSubject, setEditingSubject] = useState(null);
  
  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Delete modal state
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState(null);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const handleEdit = (sub) => {
    setEditingSubject(sub);
    setName(sub.name);
    setStatus(sub.status || 'completed');
  };

  const handleCancelEdit = () => {
    setEditingSubject(null);
    setName('');
    setStatus('completed');
  };

  const handleToggleStatus = async (sub) => {
    const nextStatus = sub.status === 'completed' ? 'studying' : 'completed';
    try {
      await axios.put(
        `${API_URL}/api/subjects/${sub.id}`,
        { 
          name: sub.name, 
          credit: sub.credit || 1, 
          score: null, 
          status: nextStatus 
        },
        axiosConfig
      );
      addToast(`Đã chuyển trạng thái môn "${sub.name}" thành công!`, 'success');
      onSubjectChange();
    } catch (error) {
      console.error('Toggle status error:', error);
      addToast('Không thể thay đổi trạng thái môn học.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Vui lòng nhập tên môn học!', 'error');
      return;
    }

    try {
      if (editingSubject) {
        // Edit API PUT /api/subjects/:id
        await axios.put(
          `${API_URL}/api/subjects/${editingSubject.id}`, 
          { 
            name: name.trim(), 
            credit: editingSubject.credit || 1, 
            score: null, 
            status 
          },
          axiosConfig
        );
        addToast(`Đã sửa môn "${name}" thành công!`, 'success');
        onSubjectChange();
        handleCancelEdit();
      } else {
        // Add API POST /api/subjects
        await axios.post(
          `${API_URL}/api/subjects`,
          { 
            name: name.trim(), 
            credit: 1, 
            score: null, 
            status 
          },
          axiosConfig
        );
        addToast(`Đã thêm môn học "${name}" thành công!`, 'success');
        setName('');
        setStatus('completed');
        onSubjectChange();
      }
    } catch (error) {
      console.error('Subject submit error:', error);
      const msg = error.response?.data?.message || 'Không thể lưu thông tin môn học.';
      addToast(msg, 'error');
    }
  };

  const handleDeleteClick = (sub) => {
    setDeleteConfirmSubject(sub);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmSubject) return;

    try {
      await axios.delete(
        `${API_URL}/api/subjects/${deleteConfirmSubject.id}`,
        axiosConfig
      );
      addToast(`Đã xóa môn "${deleteConfirmSubject.name}" và toàn bộ lịch học liên quan!`, 'success');
      onSubjectChange();
    } catch (error) {
      console.error('Subject delete error:', error);
      const msg = error.response?.data?.message || 'Lỗi khi xóa môn học.';
      addToast(msg, 'error');
    } finally {
      setDeleteConfirmSubject(null);
    }
  };

  // Filter subjects locally for quick responsiveness
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (sub.status || 'completed') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Form Card */}
      <div className="glass-card">
        <h3 className="gradient-text" style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} color="var(--secondary)" />
          {editingSubject ? 'Sửa Môn Học' : 'Thêm Môn Học Mới'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="subj-name">Tên môn học</label>
            <input 
              id="subj-name"
              type="text"
              className="form-input"
              placeholder="Ví dụ: Giải tích, Lập trình C..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Trạng thái học tập</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`weekday-btn ${status === 'completed' ? 'active' : ''}`}
                onClick={() => setStatus('completed')}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              >
                Đã hoàn thành
              </button>
              <button
                type="button"
                className={`weekday-btn ${status === 'studying' ? 'active' : ''}`}
                onClick={() => setStatus('studying')}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              >
                Đang học
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {editingSubject ? <Check size={18} /> : <Plus size={18} />}
              <span>{editingSubject ? 'Cập Nhật' : 'Thêm Môn'}</span>
            </button>
            {editingSubject && (
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
      <div className="glass-card" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="gradient-text" style={{ fontSize: '1.25rem' }}>Danh Sách Môn Học</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Khớp: <strong>{filteredSubjects.length}</strong> môn
          </span>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper" style={{ marginBottom: '0.75rem' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="form-input search-input"
            placeholder="Lọc môn học theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Tabs Filter */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`weekday-btn ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', minWidth: '50px' }}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`weekday-btn ${statusFilter === 'studying' ? 'active' : ''}`}
            onClick={() => setStatusFilter('studying')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', minWidth: '70px' }}
          >
            Đang học
          </button>
          <button
            type="button"
            className={`weekday-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
            style={{ padding: '4px 10px', fontSize: '0.75rem', minWidth: '100px' }}
          >
            Đã hoàn thành
          </button>
        </div>

        {/* Subjects List */}
        <div className="subject-table-wrapper">
          {filteredSubjects.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} />
              <p style={{ fontSize: '0.9rem' }}>
                {searchQuery || statusFilter !== 'All' ? 'Không tìm thấy môn học nào phù hợp!' : 'Chưa có môn học nào được thêm.'}
              </p>
            </div>
          ) : (
            filteredSubjects.map(sub => (
              <div key={sub.id} className="subject-item">
                <div className="subject-info">
                  <span className="subject-name">{sub.name}</span>
                  <div className="subject-metadata" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span 
                      onClick={() => handleToggleStatus(sub)}
                      className={`subject-score-badge ${sub.status === 'studying' ? 'score-good' : 'score-excellent'}`} 
                      style={{ 
                        padding: '2px 8px', 
                        fontSize: '0.7rem', 
                        background: sub.status === 'studying' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: sub.status === 'studying' ? 'var(--secondary)' : 'var(--success)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Bấm để đổi nhanh trạng thái"
                    >
                      {sub.status === 'studying' ? 'Đang học' : 'Đã hoàn thành'}
                    </span>
                  </div>
                </div>

                <div className="subject-actions">
                  <button 
                    onClick={() => handleEdit(sub)}
                    className="btn-icon" 
                    title="Chỉnh sửa môn học"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(sub)}
                    className="btn-icon btn-icon-danger" 
                    title="Xóa môn học"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmSubject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'hsl(354, 85%, 65%)' }}>
                <AlertTriangle size={24} />
                Xác Nhận Xóa
              </h3>
              <button 
                onClick={() => setDeleteConfirmSubject(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: '1rem 0' }}>
              Bạn có chắc chắn muốn xóa môn học <strong>"{deleteConfirmSubject.name}"</strong>?
              <br />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                * Hành động này cũng sẽ xóa toàn bộ lịch học (schedule) liên kết với môn học này trong hệ thống.
              </span>
            </p>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirmSubject(null)}
                style={{ width: 'auto' }}
              >
                Hủy Bỏ
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmDelete}
                style={{ background: 'var(--danger)', border: 'none', width: 'auto' }}
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
