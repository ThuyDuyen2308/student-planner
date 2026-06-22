import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, GraduationCap, Target } from 'lucide-react';
import api from '../services/api';

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/sync/dashboard');
        setSchedules(res.data.schedules || []);
        setExams(res.data.exams || []);
      } catch (error) {
        console.error('Lỗi khi tải lịch học:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Lịch học & Lịch thi</h1>
        <p className="mt-2 text-slate-400">
          Danh sách lịch học và thi được đồng bộ từ cổng thông tin DAU.
        </p>
      </div>

      {schedules.length === 0 && exams.length === 0 ? (
        <div className="p-8 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
          <Calendar className="mx-auto mb-4 text-slate-500" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Chưa có dữ liệu</h3>
          <p className="text-slate-400">Bạn chưa đồng bộ dữ liệu hoặc không có lịch học.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Lịch học tuần */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-indigo-400" /> Thời khóa biểu tuần
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {daysOfWeek.map(day => {
                const daySchedules = schedules.filter(s => s.day_of_week === day);
                if (daySchedules.length === 0) return null;

                return (
                  <div key={day} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                    <h3 className="font-bold text-indigo-400 mb-4">{day}</h3>
                    <div className="space-y-4">
                      {daySchedules.map((s, idx) => (
                        <div key={idx} className="pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                          <h4 className="font-medium text-white mb-2">{s.subject_name}</h4>
                          <div className="space-y-1 text-sm text-slate-400">
                            <p className="flex items-center gap-2">
                              <GraduationCap size={14} /> GV: {s.lecturer}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock size={14} /> {s.start_time} - {s.end_time}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin size={14} /> Phòng: {s.room}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lịch thi */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="text-rose-400" /> Lịch thi sắp tới
            </h2>
            {exams.length === 0 ? (
              <p className="text-slate-500 italic">Chưa có lịch thi.</p>
            ) : (
              <div className="space-y-4">
                {exams.sort((a,b) => new Date(a.exam_date) - new Date(b.exam_date)).map((e, idx) => (
                  <div key={idx} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <h4 className="font-medium text-white mb-2">{e.subject_name}</h4>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p className="flex items-center gap-2 text-rose-300">
                        <Calendar size={14} /> {new Date(e.exam_date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock size={14} /> {e.exam_time}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} /> Phòng: {e.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
