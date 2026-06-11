import { useState } from 'react';
import axios from 'axios';
import { User, Lock, Mail, Key, Save } from 'lucide-react';

export default function ProfileSection({ user, token, API_URL, onProfileUpdate, addToast }) {
  // Profile update state
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, { fullname, email }, config);
      addToast(response.data.message || 'Cập nhật thông tin thành công!', 'success');
      
      // Update local storage and app state
      const updatedUser = { ...user, fullname, email };
      localStorage.setItem('student_planner_user', JSON.stringify(updatedUser));
      onProfileUpdate(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      addToast(error.response?.data?.message || 'Lỗi khi cập nhật thông tin.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu mới và xác nhận mật khẩu không khớp.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải từ 6 ký tự trở lên.', 'error');
      return;
    }

    setIsChangingPassword(true);
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const response = await axios.put(`${API_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword
      }, config);
      
      addToast(response.data.message || 'Đổi mật khẩu thành công!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      addToast(error.response?.data?.message || 'Mật khẩu hiện tại không chính xác.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      
      {/* Update Personal Information */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          <User style={{ color: 'var(--primary)' }} />
          <span>Thông tin cá nhân</span>
        </h3>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tên tài khoản (Không thể đổi)</label>
            <input
              type="text"
              className="form-input"
              value={user?.username}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Họ và tên</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập họ và tên đầy đủ"
              value={fullname}
              onChange={e => setFullname(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Địa chỉ Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={isUpdatingProfile}>
            <Save size={16} /> {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      {/* Security / Change Password */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          <Lock style={{ color: 'var(--danger)' }} />
          <span>Đổi mật khẩu</span>
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mật khẩu hiện tại</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ marginTop: '0.5rem' }} disabled={isChangingPassword}>
            <Lock size={16} /> {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>

    </div>
  );
}
