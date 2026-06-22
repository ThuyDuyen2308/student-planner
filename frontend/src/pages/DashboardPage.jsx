import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardStats from '../components/DashboardStats';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    subjects: [],
    schedules: [],
    exams: [],
    documents: [],
    deadlines: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [syncRes, docRes, deadlineRes] = await Promise.all([
          api.get('/sync/dashboard'),
          api.get('/documents'),
          api.get('/deadlines')
        ]);

        setDashboardData({
          subjects: syncRes.data.subjects || [],
          schedules: syncRes.data.schedules || [],
          exams: syncRes.data.exams || [],
          documents: docRes.data.documents || [],
          deadlines: deadlineRes.data.deadlines || []
        });
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dayMapping = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayString = dayMapping[new Date().getDay()];
  const todaySchedules = dashboardData.schedules.filter(s => s.day_of_week === todayString);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Chào mừng trở lại, {user?.fullname || user?.email}!</h1>
        <p className="mt-2 text-slate-400">
          Dưới đây là tổng quan về tình hình học tập của bạn.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <DashboardStats dashboardData={dashboardData} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Box Lịch học hôm nay */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Lịch học hôm nay ({todayString})</h2>
              <div className="space-y-4">
                {todaySchedules.length > 0 ? (
                  todaySchedules.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                      <h4 className="font-medium text-white">{s.subject_name}</h4>
                      <p className="text-sm text-slate-400 mt-1">Phòng: {s.room} | Giờ: {s.start_time} - {s.end_time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">Hôm nay bạn không có lịch học.</p>
                )}
              </div>
            </section>

            {/* Box Deadline sắp tới */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Deadline sắp tới</h2>
              <div className="space-y-4">
                {dashboardData.deadlines.filter(d => new Date(d.due_date) > new Date() && d.status !== 'completed').length > 0 ? (
                  dashboardData.deadlines
                    .filter(d => new Date(d.due_date) > new Date() && d.status !== 'completed')
                    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                    .slice(0, 3)
                    .map((d, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{d.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{d.subject_name}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                        {new Date(d.due_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">Tuyệt vời! Bạn không có deadline nào sắp tới.</p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
