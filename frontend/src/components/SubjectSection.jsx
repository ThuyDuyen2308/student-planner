import { useState } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, Edit2, Check, X, AlertTriangle, BookOpen } from 'lucide-react';

export default function SubjectSection({ subjects, onSubjectChange, addToast, API_URL, token }) {
  const [name, setName] = useState('');
  const [credit, setCredit] = useState('');
  const [score, setScore] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [deleteConfirmSubject, setDeleteConfirmSubject] = useState(null);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const getScoreClass = (sc) => {
    if (sc >= 8.5) return 'score-excellent';
    if (sc >= 6.5) return 'score-good';
    if (sc >= 5.0) return 'score-average';
    return 'score-fail';
  };

  const handleEdit = (sub) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCredit(sub.credit);
    setScore(sub.score);
  };

  const handleCancelEdit = () => {
    setEditingSubject(null);
    setName('');
    setCredit('');
    setScore('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !credit || score === '') {
      addToast('Vui lòng điền đầy đủ các thông tin môn học!', 'error');
      return;
    }

    const parsedCredit = parseInt(credit, 10);
    const parsedScore = parseFloat(score);

    if (isNaN(parsedCredit) || parsedCredit <= 0) {
      addToast('Số tín chỉ phải là một số nguyên dương!', 'error');
      return;
    }

    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10) {
      addToast('Điểm số phải từ 0 đến 10!', 'error');
      return;
    }

    try {
      if (editingSubject) {
        // Edit API PUT /api/subjects/:id
        await axios.put(
          `${API_URL}/api/subjects/${editingSubject.id}`, 
          { name: name.trim(), credit: parsedCredit, score: parsedScore },
          axiosConfig
        );
        addToast(`Đã sửa môn "${name}" thành công!`, 'success');
        onSubjectChange();
        handleCancelEdit();
      } else {
        // Add API POST /api/subjects
        await axios.post(
          `${API_URL}/api/subjects`,
          { name: name.trim(), credit: parsedCredit, score: parsedScore },
          axiosConfig
        );
        addToast(`Đã thêm môn học "${name}" thành công!`, 'success');
        setName('');
        setCredit('');
        setScore('');
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
  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="subj-credit">Số tín chỉ</label>
              <input 
                id="subj-credit"
                type="number"
                min="1"
                max="10"
                className="form-input"
                placeholder="Số tín..."
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="subj-score">Điểm số (0-10)</label>
              <input 
                id="subj-score"
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="form-input"
                placeholder="Điểm số..."
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
              />
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
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="form-input search-input"
            placeholder="Lọc môn học theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Subjects List */}
        <div className="subject-table-wrapper">
          {filteredSubjects.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} />
              <p style={{ fontSize: '0.9rem' }}>
                {searchQuery ? 'Không tìm thấy môn học nào phù hợp!' : 'Chưa có môn học nào được thêm.'}
              </p>
            </div>
          ) : (
            filteredSubjects.map(sub => (
              <div key={sub.id} className="subject-item">
                <div className="subject-info">
                  <span className="subject-name">{sub.name}</span>
                  <div className="subject-metadata">
                    <span>Tín chỉ: <strong>{sub.credit}</strong></span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Điểm: 
                      <strong className={getScoreClass(sub.score)} style={{ fontSize: '0.9rem' }}>
                        {Number(sub.score).toFixed(1)}
                      </strong>
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
