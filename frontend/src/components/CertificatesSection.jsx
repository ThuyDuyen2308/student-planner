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

  // Tính toán số liệu thống kê chứng chỉ
  const totalCerts = certificates.length;
  const obtainedCerts = certificates.filter(c => c.status === 'obtained').length;
  const studyingCerts = certificates.filter(c => c.status === 'studying').length;

  // Xác định trạng thái hiệu lực của chứng chỉ
  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return null;
    const now = new Date();
    // Đặt giờ về 0 để so sánh chính xác ngày
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Hết hạn', className: 'status-failed' };
    } else if (diffDays <= 90) {
      return { label: `Sắp hết hạn (${diffDays} ngày)`, className: 'status-not_applied' };
    }
    return { label: 'Còn hiệu lực', className: 'status-passed' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Hàng Thống kê Chứng chỉ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
          <div className="user-avatar" style={{ width: '42px', height: '42px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng chứng chỉ</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white' }}>{totalCerts}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
          <div className="user-avatar" style={{ width: '42px', height: '42px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đã đạt được</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--success)' }}>{obtainedCerts}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning)' }}>
          <div className="user-avatar" style={{ width: '42px', height: '42px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đang ôn thi</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--warning)' }}>{studyingCerts}</h3>
          </div>
        </div>
      </div>

      {/* 2. Khung Quản lý danh sách */}
      <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'white' }}>
              <Award style={{ color: 'var(--secondary)' }} className="glow-text" />
              <span>Hồ sơ Chứng chỉ Học thuật</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Quản lý các chứng chỉ ngoại ngữ, chứng chỉ nghề nghiệp và chuyên môn của bạn.
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 18px', fontSize: '0.85rem' }} onClick={openAddModal}>
            <Plus size={16} /> Thêm chứng chỉ mới
          </button>
        </div>

        {certificates.length === 0 ? (
          <div className="empty-state">
            <Award size={56} />
            <p style={{ fontWeight: 500 }}>Chưa lưu thông tin chứng chỉ nào.</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bấm nút phía trên để thêm chứng chỉ đầu tiên phục vụ lộ trình học tập của bạn!</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {certificates.map(cert => {
              const expiryStatus = cert.status === 'obtained' ? getExpiryStatus(cert.expiry_date) : null;
              
              return (
                <div 
                  key={cert.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '1.25rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem', 
                    margin: 0, 
                    border: cert.status === 'obtained' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-color)',
                    background: cert.status === 'obtained' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(0,0,0,0.2))' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  
                  {/* Header của thẻ chứng chỉ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div className="user-avatar" style={{ 
                        width: '36px', 
                        height: '36px', 
                        background: cert.status === 'obtained' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: cert.status === 'obtained' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        <Award size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'white' }}>{cert.name}</h4>
                        {cert.score && (
                          <span className="subject-score-badge score-excellent" style={{ fontSize: '0.75rem', padding: '1px 6px', marginTop: '2px', display: 'inline-block' }}>
                            Điểm số: {cert.score}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="subject-actions">
                      <button className="btn-icon" onClick={() => openEditModal(cert)} title="Chỉnh sửa thông tin">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(cert)} title="Xóa chứng chỉ">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Trạng thái và Thời hạn của chứng chỉ */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    {cert.status === 'obtained' ? (
                      <span className="subject-score-badge score-good" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                        <CheckCircle size={12} /> Đã đạt được
                      </span>
                    ) : (
                      <span className="subject-score-badge score-average" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px' }}>
                        <Clock size={12} /> Đang ôn thi
                      </span>
                    )}

                    {/* Huy hiệu cảnh báo hết hạn */}
                    {expiryStatus && (
                      <span className={`subject-score-badge ${expiryStatus.className}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {expiryStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Chi tiết ngày thi/ngày hết hạn */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {cert.exam_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} />
                        <span>Ngày thi: {new Date(cert.exam_date).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                    {cert.expiry_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} style={{ color: expiryStatus?.label === 'Hết hạn' ? 'var(--danger)' : 'var(--text-muted)' }} />
                        <span style={{ color: expiryStatus?.label === 'Hết hạn' ? 'var(--danger)' : 'var(--text-muted)' }}>
                          Hết hạn: {new Date(cert.expiry_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa chứng chỉ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'white', fontWeight: 800 }}>
              {editingCert ? 'Cập nhật chứng chỉ' : 'Thêm chứng chỉ mới'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên chứng chỉ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: IELTS, TOEIC, MOS Excel, AWS..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Trạng thái hiện tại</label>
                <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="studying">Đang ôn tập / Dự thi</option>
                  <option value="obtained">Đã sở hữu chứng chỉ</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Điểm số / Kết quả (Tùy chọn)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: 7.5, 990, Pass, 95/100..."
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
                  <label className="form-label">Hết hạn (Nếu có)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1 }}>
                  {editingCert ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
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
