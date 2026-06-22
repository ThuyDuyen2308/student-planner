import { useState, useEffect } from 'react';
import { ListTodo, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

export default function DeadlinePage() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', subject_name: '', description: '', due_date: '', priority: 'medium' });

  const fetchDeadlines = async () => {
    try {
      const res = await api.get('/deadlines');
      setDeadlines(res.data.deadlines || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeadlines(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deadlines', form);
      setShowModal(false);
      setForm({ title: '', subject_name: '', description: '', due_date: '', priority: 'medium' });
      fetchDeadlines();
    } catch (error) {
      alert('Lỗi khi thêm deadline');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa deadline này?')) return;
    try {
      await api.delete(`/deadlines/${id}`);
      fetchDeadlines();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleStatus = async (deadline) => {
    const newStatus = deadline.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.put(`/deadlines/${deadline.id}`, { ...deadline, status: newStatus });
      fetchDeadlines();
    } catch (error) {
      console.error(error);
    }
  };

  const priorityColors = {
    high: 'text-red-400 bg-red-400/10 border-red-500/20',
    medium: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Quản lý Deadline</h1>
          <p className="mt-2 text-slate-400">Theo dõi bài tập và đồ án với mức độ ưu tiên.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus size={16} /> Thêm Deadline
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : deadlines.length === 0 ? (
        <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
          <ListTodo className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Chưa có deadline nào</h3>
          <p className="text-slate-400">Bấm "Thêm Deadline" để tạo mới.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deadlines.map(d => (
            <div key={d.id} className={`rounded-xl border border-slate-800 bg-slate-900/80 p-5 relative overflow-hidden ${d.status === 'completed' ? 'opacity-50' : ''}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${
                d.priority === 'high' ? 'bg-red-500' : d.priority === 'medium' ? 'bg-orange-500' : 'bg-emerald-500'
              }`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs px-2 py-1 rounded border ${priorityColors[d.priority]}`}>
                  {d.priority.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleStatus(d)} className="text-slate-400 hover:text-emerald-400 transition" title="Đánh dấu hoàn thành">
                    <CheckCircle size={18} className={d.status === 'completed' ? 'text-emerald-500' : ''} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-400 transition" title="Xóa">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className={`text-lg font-bold ${d.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{d.title}</h3>
              <p className="text-sm font-medium text-indigo-400 mb-2">{d.subject_name}</p>
              {d.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{d.description}</p>}
              
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-950 px-3 py-2 rounded-lg w-fit">
                <Clock size={14} className="text-slate-500" />
                {new Date(d.due_date).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-6 text-xl font-bold text-white">Thêm Deadline</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Tiêu đề *</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Môn học</label>
                <input type="text" value={form.subject_name} onChange={e => setForm({...form, subject_name: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Ngày hạn *</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Độ ưu tiên</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500">
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Mô tả (tùy chọn)</label>
                <textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500"></textarea>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg">Lưu Deadline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
