import { useState } from 'react';
import axios from 'axios';
import { Briefcase, Calendar, Building2, MapPin, Clock, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InternshipSection({ companies, interviews, onDataChange, addToast, API_URL, token }) {
  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  
  // Editing states
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);

  // Company Form state
  const [compName, setCompName] = useState('');
  const [compPosition, setCompPosition] = useState('');
  const [compStatus, setCompStatus] = useState('not_applied');
  const [compNote, setCompNote] = useState('');

  // Interview Form state
  const [intCompanyId, setIntCompanyId] = useState('');
  const [intTime, setIntTime] = useState('');
  const [intLocation, setIntLocation] = useState('');
  const [intNote, setIntNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status mapping
  const statusLabels = {
    not_applied: 'Chưa ứng tuyển',
    sent_cv: 'Đã gửi CV',
    interviewing: 'Đang phỏng vấn',
    passed: 'Đậu ✅',
    failed: 'Trượt ❌'
  };

  const statusClasses = {
    not_applied: 'score-average',
    sent_cv: 'score-good',
    interviewing: 'score-excellent',
    passed: 'score-excellent',
    failed: 'score-fail'
  };

  // Companies Handlers
  const openCompanyAdd = () => {
    setEditingCompany(null);
    setCompName('');
    setCompPosition('');
    setCompStatus('not_applied');
    setCompNote('');
    setShowCompanyModal(true);
  };

  const openCompanyEdit = (comp) => {
    setEditingCompany(comp);
    setCompName(comp.name);
    setCompPosition(comp.position);
    setCompStatus(comp.status);
    setCompNote(comp.note || '');
    setShowCompanyModal(true);
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    if (!compName.trim() || !compPosition.trim()) {
      addToast('Tên công ty và vị trí ứng tuyển là bắt buộc.', 'error');
      return;
    }

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = {
      name: compName.trim(),
      position: compPosition.trim(),
      status: compStatus,
      note: compNote.trim() || null
    };

    try {
      if (editingCompany) {
        await axios.put(`${API_URL}/api/companies/${editingCompany.id}`, payload, config);
        addToast(`Cập nhật thông tin "${compName}" thành công!`, 'success');
      } else {
        await axios.post(`${API_URL}/api/companies`, payload, config);
        addToast(`Thêm công ty "${compName}" thành công!`, 'success');
      }
      setShowCompanyModal(false);
      onDataChange();
    } catch (error) {
      console.error('Submit company error:', error);
      addToast(error.response?.data?.message || 'Không thể lưu công ty.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompanyDelete = async (comp) => {
    if (!window.confirm(`Xóa công ty "${comp.name}" sẽ xóa toàn bộ lịch phỏng vấn liên quan. Bạn có chắc chắn không?`)) {
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_URL}/api/companies/${comp.id}`, config);
      addToast(`Đã xóa công ty "${comp.name}".`, 'success');
      onDataChange();
    } catch (error) {
      console.error('Delete company error:', error);
      addToast('Không thể xóa công ty. Vui lòng thử lại sau.', 'error');
    }
  };

  // Interviews Handlers
  const openInterviewAdd = () => {
    if (companies.length === 0) {
      addToast('Vui lòng thêm ít nhất một công ty ứng tuyển trước khi lập lịch phỏng vấn.', 'warning');
      return;
    }
    setEditingInterview(null);
    setIntCompanyId(companies[0].id.toString());
    setIntTime('');
    setIntLocation('');
    setIntNote('');
    setShowInterviewModal(true);
  };

  const openInterviewEdit = (int) => {
    setEditingInterview(int);
    setIntCompanyId(int.company_id.toString());
    setIntTime(int.interview_time ? int.interview_time.substring(0, 16) : '');
    setIntLocation(int.location || '');
    setIntNote(int.note || '');
    setShowInterviewModal(true);
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!intCompanyId || !intTime) {
      addToast('Vui lòng chọn công ty và thời gian phỏng vấn.', 'error');
      return;
    }

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = {
      company_id: parseInt(intCompanyId, 10),
      interview_time: intTime,
      location: intLocation.trim() || null,
      note: intNote.trim() || null
    };

    try {
      if (editingInterview) {
        await axios.put(`${API_URL}/api/interviews/${editingInterview.id}`, payload, config);
        addToast('Cập nhật lịch phỏng vấn thành công!', 'success');
      } else {
        await axios.post(`${API_URL}/api/interviews`, payload, config);
        addToast('Lập lịch phỏng vấn thành công!', 'success');
      }
      setShowInterviewModal(false);
      onDataChange();
    } catch (error) {
      console.error('Submit interview error:', error);
      addToast(error.response?.data?.message || 'Không thể lưu lịch phỏng vấn.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInterviewDelete = async (int) => {
    if (!window.confirm('Bạn có muốn xóa lịch phỏng vấn này không?')) {
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_URL}/api/interviews/${int.id}`, config);
      addToast('Đã xóa lịch phỏng vấn.', 'success');
      onDataChange();
    } catch (error) {
      console.error('Delete interview error:', error);
      addToast('Không thể xóa lịch phỏng vấn.', 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
      
      {/* Applied Companies Section */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
            <Building2 style={{ color: 'var(--primary)' }} />
            <span>Công ty ứng tuyển</span>
          </h3>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} onClick={openCompanyAdd}>
            <Plus size={16} /> Thêm công ty
          </button>
        </div>

        {companies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Building2 size={48} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p>Chưa lưu thông tin công ty ứng tuyển nào.</p>
          </div>
        ) : (
          <div className="subject-table-wrapper" style={{ maxHeight: '550px' }}>
            {companies.map(comp => (
              <div key={comp.id} className="subject-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{comp.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Vị trí: {comp.position}</span>
                  </div>
                  <div className="subject-actions">
                    <button className="btn-icon" onClick={() => openCompanyEdit(comp)} title="Sửa">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleCompanyDelete(comp)} title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                  <span className={`subject-score-badge ${statusClasses[comp.status]}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    {statusLabels[comp.status]}
                  </span>
                  {comp.note && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', italic: true }}>Ghi chú: {comp.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interviews Section */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
            <Calendar style={{ color: 'var(--secondary)' }} />
            <span>Lịch phỏng vấn</span>
          </h3>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} onClick={openInterviewAdd}>
            <Plus size={16} /> Lập lịch
          </button>
        </div>

        {interviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Clock size={48} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p>Chưa xếp lịch phỏng vấn nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {interviews.map(int => (
              <div key={int.id} className="subject-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--secondary)' }}>{int.company_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{int.company_position}</span>
                  </div>
                  <div className="subject-actions">
                    <button className="btn-icon" onClick={() => openInterviewEdit(int)} title="Sửa">
                      <Edit2 size={12} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleInterviewDelete(int)} title="Xóa">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontWeight: 600 }}>
                    <Clock size={12} />
                    <span>{new Date(int.interview_time).toLocaleString('vi-VN')}</span>
                  </div>
                  {int.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <MapPin size={12} />
                      <span>{int.location}</span>
                    </div>
                  )}
                  {int.note && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Note: {int.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingCompany ? 'Sửa thông tin công ty' : 'Thêm công ty ứng tuyển'}
            </h3>
            <form onSubmit={handleCompanySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên công ty</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: FPT Software, VNG, Viettel..."
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Vị trí ứng tuyển</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Frontend Intern, Backend Developer..."
                  value={compPosition}
                  onChange={e => setCompPosition(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Trạng thái ứng tuyển</label>
                <select className="form-input" value={compStatus} onChange={e => setCompStatus(e.target.value)}>
                  <option value="not_applied">Chưa ứng tuyển</option>
                  <option value="sent_cv">Đã gửi CV</option>
                  <option value="interviewing">Đang phỏng vấn</option>
                  <option value="passed">Đậu</option>
                  <option value="failed">Trượt</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ghi chú thêm</label>
                <textarea
                  className="form-input"
                  placeholder="Link tuyển dụng, thông tin liên hệ, đãi ngộ..."
                  value={compNote}
                  onChange={e => setCompNote(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {editingCompany ? 'Cập nhật' : 'Lưu lại'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCompanyModal(false)}>
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="modal-overlay" onClick={() => setShowInterviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingInterview ? 'Cập nhật lịch phỏng vấn' : 'Lên lịch phỏng vấn mới'}
            </h3>
            <form onSubmit={handleInterviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Công ty ứng tuyển</label>
                <select className="form-input" value={intCompanyId} onChange={e => setIntCompanyId(e.target.value)}>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.position}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Thời gian phỏng vấn</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={intTime}
                  onChange={e => setIntTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Địa điểm / Hình thức</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Google Meet, Văn phòng công ty..."
                  value={intLocation}
                  onChange={e => setIntLocation(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ghi chú phỏng vấn</label>
                <textarea
                  className="form-input"
                  placeholder="Chuẩn bị câu hỏi thuật toán, bài giới thiệu bản thân..."
                  value={intNote}
                  onChange={e => setIntNote(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {editingInterview ? 'Cập nhật' : 'Lên lịch'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInterviewModal(false)}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
