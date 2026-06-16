import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Award, Target, Briefcase, ShieldAlert, Search, Trash2, Lock, Unlock } from 'lucide-react';

export default function AdminSection({ token, API_URL, addToast }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCertificates: 0,
    totalCareerGoals: 0,
    totalInternships: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/admin/stats`, config);
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/api/admin/users?search=${searchQuery}`, config);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast('Không thể tải danh sách người dùng.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleToggleBlock = async (userId, username, isCurrentlyBlocked) => {
    const action = isCurrentlyBlocked ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản "${username}" không?`)) {
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL}/api/admin/users/${userId}/block`, { is_blocked: !isCurrentlyBlocked }, config);
      addToast(`Đã ${action} tài khoản thành công!`, 'success');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error blocking user:', error);
      addToast(error.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.', 'error');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${username}" không? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      console.log('Deleting user:', userId); // Log để kiểm tra userId
      console.log('API_URL:', API_URL); // Log để kiểm tra API_URL
      console.log('Token:', token); // Log để kiểm tra token

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.delete(`${API_URL}/api/admin/users/${userId}`, config);

      if (response.status === 200) {
        addToast(`Đã xóa vĩnh viễn tài khoản "${username}"!`, 'success');
        fetchUsers(); // Cập nhật danh sách người dùng
        fetchStats(); // Cập nhật thống kê
      } else {
        addToast('Không thể xóa tài khoản người dùng.', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error); // Log lỗi chi tiết
      addToast(error.response?.data?.message || 'Không thể xóa tài khoản người dùng.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Aggregate Statistics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div className="auth-logo" style={{ width: '46px', height: '46px', margin: 0, borderRadius: '8px', background: 'linear-gradient(135deg, hsl(250, 85%, 65%), hsl(280, 80%, 65%))' }}>
            <Users size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng số người dùng</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div className="auth-logo" style={{ width: '46px', height: '46px', margin: 0, borderRadius: '8px', background: 'linear-gradient(135deg, hsl(180, 75%, 50%), hsl(250, 85%, 65%))' }}>
            <Award size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng số chứng chỉ</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>{stats.totalCertificates}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div className="auth-logo" style={{ width: '46px', height: '46px', margin: 0, borderRadius: '8px', background: 'linear-gradient(135deg, hsl(280, 80%, 65%), hsl(354, 85%, 55%))' }}>
            <Target size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mục tiêu nghề nghiệp</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>{stats.totalCareerGoals}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
          <div className="auth-logo" style={{ width: '46px', height: '46px', margin: 0, borderRadius: '8px', background: 'linear-gradient(135deg, hsl(145, 80%, 45%), hsl(180, 75%, 50%))' }}>
            <Briefcase size={20} color="white" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Công ty ứng tuyển</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'white' }}>{stats.totalInternships}</h3>
          </div>
        </div>

      </div>

      {/* User Management Directory */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700 }}>
            <ShieldAlert style={{ color: 'var(--danger)' }} />
            <span>Quản lý tài khoản người dùng</span>
          </h3>

          <div className="search-wrapper" style={{ margin: 0, width: '100%', maxWidth: '300px' }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Tìm kiếm tài khoản/email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="subject-table-wrapper" style={{ maxHeight: '450px' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px' }}>ID</th>
                <th style={{ padding: '12px 16px' }}>Tên đăng nhập</th>
                <th style={{ padding: '12px 16px' }}>Họ và tên</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Vai trò</th>
                <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Đang tải danh sách người dùng...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="admin-tr" style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{u.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '12px 16px' }}>{u.fullname || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>{u.email || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`subject-score-badge ${u.role === 'admin' ? 'score-excellent' : 'score-good'}`} style={{ fontSize: '0.75rem', padding: '1px 6px' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.is_blocked ? (
                        <span className="subject-score-badge score-fail" style={{ fontSize: '0.75rem', padding: '1px 6px' }}>Bị khóa</span>
                      ) : (
                        <span className="subject-score-badge score-good" style={{ fontSize: '0.75rem', padding: '1px 6px' }}>Hoạt động</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {u.username !== 'admin' && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => handleToggleBlock(u.id, u.username, u.is_blocked)}
                              title={u.is_blocked ? 'Mở khóa' : 'Khóa tài khoản'}
                              style={{ color: u.is_blocked ? 'var(--success)' : 'var(--warning)' }}
                            >
                              {u.is_blocked ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                              className="btn-icon btn-icon-danger"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
