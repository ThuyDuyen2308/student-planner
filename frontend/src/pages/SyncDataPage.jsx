import { DownloadCloud, Globe, LogIn, MousePointerClick, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';

const steps = [
  {
    icon: <Globe size={22} />,
    title: 'Bước 1: Cài đặt Extension',
    desc: 'Mở Chrome, truy cập vào trang quản lý tiện ích mở rộng.',
    detail: 'chrome://extensions/',
    isLink: true,
    note: 'Bật chế độ "Developer mode" (góc trên phải), nhấn "Load unpacked" và chọn thư mục extension/ trong dự án Student Planner của bạn.',
  },
  {
    icon: <LogIn size={22} />,
    title: 'Bước 2: Đăng nhập vào Extension',
    desc: 'Nhấn vào biểu tượng Extension trên thanh công cụ Chrome.',
    detail: null,
    note: 'Nhập Email và Mật khẩu Student Planner (tương tự đăng nhập trên web) để kết nối Extension với tài khoản của bạn.',
  },
  {
    icon: <ExternalLink size={22} />,
    title: 'Bước 3: Đăng nhập cổng thông tin DAU',
    desc: 'Truy cập vào trang sinh viên của trường và đăng nhập bình thường (Bạn tự giải Captcha).',
    detail: 'https://sinhvien.dau.edu.vn',
    isLink: true,
    note: 'Sau khi đăng nhập thành công và thấy thông tin của mình hiển thị, hãy chuyển sang bước tiếp theo.',
  },
  {
    icon: <MousePointerClick size={22} />,
    title: 'Bước 4: Bắt đầu cào dữ liệu',
    desc: 'Trên trang sinhvien.dau.edu.vn, nhấn vào biểu tượng Extension.',
    detail: null,
    note: 'Bấm nút "Bắt đầu Cào Dữ Liệu". Extension sẽ lấy toàn bộ dữ liệu (Lịch học, Điểm số, Lịch thi) và gửi về Student Planner tự động!',
  },
];

export default function SyncDataPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);

  // Nút "Cập nhật thủ công" — chạy Mock data nếu không có Extension (dùng để test)
  const handleManualSync = async () => {
    setSyncing(true);
    setResult(null);
    try {
      const res = await api.post('/sync');
      setResult({ success: true, message: res.data.message });
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Đồng bộ thất bại.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
          <DownloadCloud size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Đồng bộ Dữ liệu DAU</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sử dụng Chrome Extension để lấy dữ liệu học tập từ cổng thông tin trường.</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-white font-semibold mb-1">
                <span className="text-indigo-400">{step.icon}</span>
                {step.title}
              </div>
              <p className="text-slate-400 text-sm mb-2">{step.desc}</p>
              {step.detail && (
                step.isLink ? (
                  <a
                    href={step.detail}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-slate-600 text-indigo-300 px-3 py-1.5 rounded-lg hover:border-indigo-500 transition mb-2"
                  >
                    <ExternalLink size={12} />
                    {step.detail}
                  </a>
                ) : (
                  <code className="text-xs bg-slate-900 border border-slate-600 text-indigo-300 px-3 py-1.5 rounded-lg mb-2 block w-fit">{step.detail}</code>
                )
              )}
              <p className="text-xs text-slate-500 leading-relaxed">{step.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kết quả */}
      {result && (
        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
          result.success
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/30 bg-red-500/10 text-red-300'
        }`}>
          {result.success ? <CheckCircle size={16} /> : null}
          {result.message}
        </div>
      )}

      {/* Nút kiểm tra thủ công */}
      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/50 p-5 text-center">
        <p className="text-slate-400 text-sm mb-4">
          <span className="text-amber-400 font-semibold">Chưa cài Extension?</span> Bạn có thể bấm nút bên dưới để nạp <strong>dữ liệu mẫu</strong> vào hệ thống và trải nghiệm trước các tính năng.
        </p>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Đang tải dữ liệu mẫu...' : 'Nạp dữ liệu mẫu (Demo)'}
        </button>
      </div>
    </div>
  );
}
