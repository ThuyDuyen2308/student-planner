import { useState } from 'react';
import axios from 'axios';
import { Award, Calendar, Edit2, Trash2, Plus, CheckCircle, Clock } from 'lucide-react';

export default function CertificatesSection({ certificates, onCertificateChange, addToast, API_URL, token }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [status, setStatus] = useState('studying');
  const [score, setScore] = useState('');
  const [examDate, setExamDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingCert(null);
    setName('');
    setStatus('studying');
    setScore('');
    setExamDate('');
    setExpiryDate('');
    setShowModal(true);
  };

  const openEditModal = (cert) => {
    setEditingCert(cert);
    setName(cert.name);
    setStatus(cert.status);
    setScore(cert.score || '');
    setExamDate(cert.exam_date ? cert.exam_date.substring(0, 10) : '');
    setExpiryDate(cert.expiry_date ? cert.expiry_date.substring(0, 10) : '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Vui lòng nhập tên chứng chỉ.', 'error');
      return;
    }

    setIsSubmitting(true);
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    const payload = {
      name: name.trim(),
      status,
      score: score ? score.trim() : null,
      exam_date: examDate || null,
      expiry_date: expiryDate || null
    };

    try {
      if (editingCert) {
        await axios.put(`${API_URL}/api/certificates/${editingCert.id}`, payload, config);
        addToast(`Cập nhật chứng chỉ "${name}" thành công!`, 'success');
      } else {
        await axios.post(`${API_URL}/api/certificates`, payload, config);
        addToast(`Thêm chứng chỉ "${name}" thành công!`, 'success');
      }
      setShowModal(false);
      onCertificateChange();
    } catch (error) {
      console.error('Submit certificate error:', error);
      addToast(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cert) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chứng chỉ "${cert.name}" không?`)) {
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      await axios.delete(`${API_URL}/api/certificates/${cert.id}`, config);
      addToast(`Xóa chứng chỉ "${cert.name}" thành công!`, 'success');
      onCertificateChange();
    } catch (error) {
      console.error('Delete certificate error:', error);
      addToast('Không thể xóa chứng chỉ. Vui lòng thử lại sau.', 'error');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
          <Award style={{ color: 'var(--primary)' }} />
          <span>Quản lý chứng chỉ</span>
        </h3>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} onClick={openAddModal}>
          <Plus size={16} /> Thêm chứng chỉ
        </button>
      </div>

      {certificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
          <Award size={48} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
          <p>Chưa có chứng chỉ nào được lưu. Bấm nút Thêm để bắt đầu!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {certificates.map(cert => (
            <div key={cert.id} className="subject-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', margin: 0, padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {cert.name}
                  {cert.score && <span className="subject-score-badge score-excellent" style={{ fontSize: '0.75rem', padding: '1px 6px' }}>{cert.score}</span>}
                </div>
                <div className="subject-actions">
                  <button className="btn-icon" onClick={() => openEditModal(cert)} title="Sửa">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(cert)} title="Xóa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.8rem' }}>
                {cert.status === 'obtained' ? (
                  <span className="subject-score-badge score-good" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                    <CheckCircle size={12} /> Đã đạt được
                  </span>
                ) : (
                  <span className="subject-score-badge score-average" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                    <Clock size={12} /> Đang ôn thi
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                {cert.exam_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>Ngày thi: {new Date(cert.exam_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                {cert.expiry_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} />
                    <span>Ngày hết hạn: {new Date(cert.expiry_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingCert ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ mới'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên chứng chỉ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: IELTS, TOEIC, MOS..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Trạng thái</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="studying">Đang ôn thi</option>
                  <option value="obtained">Đã có chứng chỉ</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Điểm số / Kết quả (Không bắt buộc)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 7.5, 900, Pass..."
                  value={score}
                  onChange={e => setScore(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ngày thi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ngày hết hạn</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {editingCert ? 'Cập nhật' : 'Lưu lại'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
