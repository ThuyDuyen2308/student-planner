import { BookOpen, ListTodo, FileText, Timer } from 'lucide-react';

export default function DashboardStats({ dashboardData }) {
  const { subjects = [], schedules = [], exams = [], documents = [], deadlines = [] } = dashboardData;

  // Tính số môn học hôm nay
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long' });
  const classesToday = schedules.filter(s => s.day_of_week === today).length;

  // Tìm deadline gần nhất
  const now = new Date();
  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.due_date) > now && d.status !== 'completed')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextDeadline = upcomingDeadlines[0];

  // Tính tổng tài liệu
  const totalDocs = documents.length;

  // Tính số ngày còn lại đến kỳ thi gần nhất
  const upcomingExams = exams
    .filter(e => new Date(e.exam_date) > now)
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
  
  let daysToExam = null;
  if (upcomingExams.length > 0) {
    const diffTime = Math.abs(new Date(upcomingExams[0].exam_date) - now);
    daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Card 1 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <BookOpen size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">Môn học hôm nay</p>
        <h3 className="text-2xl font-bold text-white">
          {classesToday} <span className="text-sm font-normal text-slate-500">môn</span>
        </h3>
      </div>

      {/* Card 2 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl">
            <ListTodo size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">Deadline gần nhất</p>
        <h3 className="text-lg font-bold text-white truncate" title={nextDeadline?.title || 'Không có'}>
          {nextDeadline ? nextDeadline.title : 'Không có'}
        </h3>
        {nextDeadline && (
          <p className="text-xs text-orange-400 mt-1">
            Hạn: {new Date(nextDeadline.due_date).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>

      {/* Card 3 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <FileText size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">Tổng tài liệu đã lưu</p>
        <h3 className="text-2xl font-bold text-white">
          {totalDocs} <span className="text-sm font-normal text-slate-500">file</span>
        </h3>
      </div>

      {/* Card 4 */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <Timer size={24} />
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium mb-1">Sắp tới kỳ thi</p>
        <h3 className="text-2xl font-bold text-white">
          {daysToExam !== null ? (
            <>Còn {daysToExam} <span className="text-sm font-normal text-slate-500">ngày</span></>
          ) : (
            'Chưa có lịch'
          )}
        </h3>
      </div>
    </div>
  );
}
