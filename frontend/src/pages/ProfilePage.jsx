import { useState } from 'react';
import { User, Mail, Camera, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api, { API_URL } from '../services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.put('/profile', { fullname });
      setUser(res.data.user);
      setMessage('Cập nhật hồ sơ thành công!');
    } catch (error) {
      setMessage('Lỗi khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(true);
    try {
      const res = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data.user);
      setMessage('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
      setMessage('Lỗi khi tải ảnh lên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-8">Hồ sơ cá nhân</h1>

        {message && (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 flex items-center justify-center shrink-0">
              {user?.avatar_url ? (
                <img src={`${API_URL}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-slate-500" />
              )}
            </div>
            
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
              <Camera size={24} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={loading} />
            </label>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email (Đăng nhập)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Tên người dùng (Username)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-slate-800 pt-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Họ và tên</label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 px-4 text-white outline-none focus:border-indigo-500"
              placeholder="Cập nhật họ và tên của bạn"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}
