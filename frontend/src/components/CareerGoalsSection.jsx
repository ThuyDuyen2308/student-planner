import { useState } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Plus, Edit2, Trash2, Star, Calendar } from 'lucide-react';

export default function CareerGoalsSection({ goals, skills, onDataChange, addToast, API_URL, token }) {
  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);

  // Editing states
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);

  // Goal Form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalStatus, setGoalStatus] = useState('in_progress');

  // Skill Form state
  const [skillName, setSkillName] = useState('');
  const [skillProficiency, setSkillProficiency] = useState(3);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal Form Handlers
  const openGoalAdd = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalProgress(0);
    setGoalTargetDate('');
    setGoalStatus('in_progress');
    setShowGoalModal(true);
  };

  const openGoalEdit = (goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalProgress(goal.progress);
    setGoalTargetDate(goal.target_date ? goal.target_date.substring(0, 10) : '');
    setGoalStatus(goal.status);
    setShowGoalModal(true);
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      addToast('Vui lòng nhập mục tiêu nghề nghiệp.', 'error');
      return;
    }

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = {
      title: goalTitle.trim(),
      progress: parseInt(goalProgress, 10),
      target_date: goalTargetDate || null,
      status: parseInt(goalProgress, 10) === 100 ? 'completed' : goalStatus
    };

    try {
      if (editingGoal) {
        await axios.put(`${API_URL}/api/goals/${editingGoal.id}`, payload, config);
        addToast(`Cập nhật mục tiêu "${goalTitle}" thành công!`, 'success');
      } else {
        await axios.post(`${API_URL}/api/goals`, payload, config);
        addToast(`Thêm mục tiêu "${goalTitle}" thành công!`, 'success');
      }
      setShowGoalModal(false);
      onDataChange();
    } catch (error) {
      console.error('Submit goal error:', error);
      addToast('Lỗi khi lưu mục tiêu.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalDelete = async (goal) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mục tiêu "${goal.title}" không?`)) {
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_URL}/api/goals/${goal.id}`, config);
      addToast(`Đã xóa mục tiêu "${goal.title}".`, 'success');
      onDataChange();
    } catch (error) {
      console.error('Delete goal error:', error);
      addToast('Không thể xóa mục tiêu.', 'error');
    }
  };

  // Skill Form Handlers
  const openSkillAdd = () => {
    setEditingSkill(null);
    setSkillName('');
    setSkillProficiency(3);
    setShowSkillModal(true);
  };

  const openSkillEdit = (skill) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillProficiency(skill.proficiency);
    setShowSkillModal(true);
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) {
      addToast('Vui lòng nhập tên kỹ năng.', 'error');
      return;
    }

    setIsSubmitting(true);
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = {
      name: skillName.trim(),
      proficiency: skillProficiency
    };

    try {
      if (editingSkill) {
        await axios.put(`${API_URL}/api/skills/${editingSkill.id}`, payload, config);
        addToast(`Cập nhật kỹ năng "${skillName}" thành công!`, 'success');
      } else {
        await axios.post(`${API_URL}/api/skills`, payload, config);
        addToast(`Thêm kỹ năng "${skillName}" thành công!`, 'success');
      }
      setShowSkillModal(false);
      onDataChange();
    } catch (error) {
      console.error('Submit skill error:', error);
      addToast('Lỗi khi lưu kỹ năng.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkillDelete = async (skill) => {
    if (!window.confirm(`Bạn có muốn xóa kỹ năng "${skill.name}" không?`)) {
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`${API_URL}/api/skills/${skill.id}`, config);
      addToast(`Đã xóa kỹ năng "${skill.name}".`, 'success');
      onDataChange();
    } catch (error) {
      console.error('Delete skill error:', error);
      addToast('Không thể xóa kỹ năng.', 'error');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      
      {/* Career Goals */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
            <Target style={{ color: 'var(--accent)' }} />
            <span>Mục tiêu nghề nghiệp</span>
          </h3>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} onClick={openGoalAdd}>
            <Plus size={16} /> Thêm mục tiêu
          </button>
        </div>

        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Target size={48} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p>Chưa thiết lập mục tiêu nghề nghiệp nào.</p>
          </div>
        ) : (
          <div className="subject-table-wrapper" style={{ maxHeight: '550px' }}>
            {goals.map(goal => (
              <div key={goal.id} className="subject-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{goal.title}</h4>
                    {goal.target_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Calendar size={12} /> Target: {new Date(goal.target_date).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <div className="subject-actions">
                    <button className="btn-icon" onClick={() => openGoalEdit(goal)} title="Sửa">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleGoalDelete(goal)} title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <span>Tiến độ hoàn thành</span>
                    <strong>{goal.progress}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${goal.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: '10px' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Professional Skills */}
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
            <TrendingUp style={{ color: 'var(--secondary)' }} />
            <span>Đánh giá kỹ năng</span>
          </h3>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }} onClick={openSkillAdd}>
            <Plus size={16} /> Thêm kỹ năng
          </button>
        </div>

        {skills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
            <p>Chưa cập nhật kỹ năng nào.</p>
          </div>
        ) : (
          <div className="subject-table-wrapper" style={{ maxHeight: '550px' }}>
            {skills.map(skill => (
              <div key={skill.id} className="subject-item" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>{skill.name}</h4>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= skill.proficiency ? 'var(--secondary)' : 'none'}
                        color={star <= skill.proficiency ? 'var(--secondary)' : 'var(--text-muted)'}
                        style={{ opacity: star <= skill.proficiency ? 1 : 0.4 }}
                      />
                    ))}
                  </div>
                </div>

                <div className="subject-actions">
                  <button className="btn-icon" onClick={() => openSkillEdit(skill)} title="Sửa">
                    <Edit2 size={12} />
                  </button>
                  <button className="btn-icon btn-icon-danger" onClick={() => handleSkillDelete(skill)} title="Xóa">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingGoal ? 'Sửa mục tiêu nghề nghiệp' : 'Thêm mục tiêu nghề nghiệp mới'}
            </h3>
            <form onSubmit={handleGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mục tiêu nghề nghiệp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Frontend Developer, Data Analyst, Tester..."
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label className="form-label">Tiến độ hoàn thành</label>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--secondary)' }}>{goalProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="form-input"
                  value={goalProgress}
                  onChange={e => setGoalProgress(parseInt(e.target.value, 10))}
                  style={{ padding: 0, height: '6px', background: 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ngày hoàn thành dự kiến</label>
                <input
                  type="date"
                  className="form-input"
                  value={goalTargetDate}
                  onChange={e => setGoalTargetDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Trạng thái</label>
                <select className="form-input" value={goalStatus} onChange={e => setGoalStatus(e.target.value)}>
                  <option value="in_progress">Đang thực hiện</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {editingGoal ? 'Cập nhật' : 'Lưu lại'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
        <div className="modal-overlay" onClick={() => setShowSkillModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {editingSkill ? 'Sửa kỹ năng' : 'Thêm kỹ năng mới'}
            </h3>
            <form onSubmit={handleSkillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tên kỹ năng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: HTML/CSS, ReactJS, NodeJS, Tiếng Anh..."
                  value={skillName}
                  onChange={e => setSkillName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Mức độ thành thạo (1 - 5 sao)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSkillProficiency(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Star
                        size={28}
                        fill={star <= skillProficiency ? 'var(--secondary)' : 'none'}
                        color={star <= skillProficiency ? 'var(--secondary)' : 'var(--text-muted)'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {editingSkill ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>
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
