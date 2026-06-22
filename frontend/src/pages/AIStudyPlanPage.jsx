import { useState, useEffect } from 'react';
import { Briefcase, Calendar as CalendarIcon, Clock, Target, ListTodo } from 'lucide-react';
import api from '../services/api';

export default function AIStudyPlanPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const [form, setForm] = useState({
    subjectName: '',
    examDate: '',
    proficiencyLevel: 'medium',
    hoursPerDay: 2
  });

  const fetchPlans = async () => {
    try {
      const res = await api.get('/ai/study-plan');
      setPlans(res.data.plans || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post('/ai/study-plan', form);
      fetchPlans();
      setForm({ subjectName: '', examDate: '', proficiencyLevel: 'medium', hoursPerDay: 2 });
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi lập kế hoạch');
    } finally {
      setGenerating(false);
    }
  };

  const getProficiencyLabel = (level) => {
    if (level === 'weak') return 'Yếu (Cần học từ đầu)';
    if (level === 'medium') return 'Trung bình (Nắm cơ bản)';
    if (level === 'good') return 'Khá giỏi (Chỉ cần ôn tập)';
    return level;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Briefcase className="text-emerald-400" /> AI Lập kế hoạch ôn thi
        </h1>
        <p className="mt-2 text-slate-400">Nhập thông tin môn học và ngày thi, AI sẽ tạo một lộ trình học tập tối ưu cho bạn.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form tạo kế hoạch */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-6">Tạo lộ trình mới</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tên môn học *</label>
              <input required type="text" value={form.subjectName} onChange={e => setForm({...form, subjectName: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-emerald-500" placeholder="VD: Toán rời rạc" />
            </div>
            
            <div>
              <label className="mb-2 block text-sm text-slate-300">Ngày thi *</label>
              <input required type="date" value={form.examDate} onChange={e => setForm({...form, examDate: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-emerald-500 [color-scheme:dark]" />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Mức độ hiểu bài hiện tại</label>
              <select value={form.proficiencyLevel} onChange={e => setForm({...form, proficiencyLevel: e.target.value})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-emerald-500">
                <option value="weak">Yếu (Cần học từ đầu)</option>
                <option value="medium">Trung bình (Đã nắm cơ bản)</option>
                <option value="good">Khá giỏi (Chỉ cần ôn luyện đề)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Thời gian ôn tập mỗi ngày (giờ)</label>
              <input required type="number" min="1" max="12" value={form.hoursPerDay} onChange={e => setForm({...form, hoursPerDay: parseInt(e.target.value)})} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-emerald-500" />
            </div>

            <button type="submit" disabled={generating} className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 mt-4">
              {generating ? 'Đang phân tích...' : 'Sinh lộ trình'}
            </button>
          </form>
        </div>

        {/* Danh sách kế hoạch */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white mb-6">Lộ trình của tôi</h2>
          
          {loading ? (
            <div className="flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : plans.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
              <ListTodo className="mx-auto mb-4 text-slate-500" size={48} />
              <p className="text-slate-400">Bạn chưa tạo lộ trình ôn thi nào.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {plans.map(plan => {
                let parsedContent = [];
                try {
                  parsedContent = JSON.parse(plan.plan_content);
                } catch (e) {
                  // Fallback
                }
                
                return (
                  <div key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 bg-slate-800/30">
                      <h3 className="text-xl font-bold text-emerald-400">{plan.subject_name}</h3>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1.5"><CalendarIcon size={16} className="text-slate-500"/> Thi: {new Date(plan.exam_date).toLocaleDateString('vi-VN')}</span>
                        <span className="flex items-center gap-1.5"><Target size={16} className="text-slate-500"/> {getProficiencyLabel(plan.proficiency_level)}</span>
                        <span className="flex items-center gap-1.5"><Clock size={16} className="text-slate-500"/> {plan.hours_per_day}h / ngày</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {Array.isArray(parsedContent) && parsedContent.map((dayPlan, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
                              N{dayPlan.day}
                            </div>
                            {idx !== parsedContent.length - 1 && <div className="w-px h-full bg-slate-800 my-2"></div>}
                          </div>
                          <div className="pb-6 pt-2">
                            <h4 className="font-semibold text-white mb-2">{dayPlan.date}</h4>
                            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-sm">
                              {dayPlan.activities && dayPlan.activities.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
