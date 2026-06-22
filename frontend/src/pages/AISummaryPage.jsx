import { useState, useEffect } from 'react';
import { Brain, FileText, AlignLeft } from 'lucide-react';
import api from '../services/api';

export default function AISummaryPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(() => sessionStorage.getItem('aiSummary_selectedDoc') || '');
  const [lengthType, setLengthType] = useState(() => sessionStorage.getItem('aiSummary_lengthType') || 'medium');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(() => sessionStorage.getItem('aiSummary_result') || '');
  const [error, setError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('aiSummary_selectedDoc', selectedDoc);
    sessionStorage.setItem('aiSummary_lengthType', lengthType);
    sessionStorage.setItem('aiSummary_result', summary);
  }, [selectedDoc, lengthType, summary]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await api.get('/documents');
        setDocuments(res.data.documents || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocuments();
  }, []);

  const handleSummarize = async () => {
    if (!selectedDoc) {
      setError('Vui lòng chọn một tài liệu để tóm tắt.');
      return;
    }
    setError('');
    setLoading(true);
    setSummary('');

    try {
      const res = await api.post('/ai/summarize', {
        documentId: selectedDoc,
        type: lengthType
      });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tóm tắt tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Brain className="text-indigo-400" /> AI Tóm tắt tài liệu
        </h1>
        <p className="mt-2 text-slate-400">Trích xuất những ý chính quan trọng nhất từ tài liệu của bạn trong tích tắc.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Chọn tài liệu</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-white outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="">-- Chọn tài liệu --</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Độ dài tóm tắt</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <select
                value={lengthType}
                onChange={(e) => setLengthType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-white outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="short">Ngắn gọn (5-10 dòng)</option>
                <option value="medium">Trung bình (~1 trang)</option>
                <option value="long">Chi tiết (Đầy đủ ý chính)</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSummarize}
          disabled={loading || documents.length === 0}
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Đang phân tích...' : 'Bắt đầu tóm tắt'}
        </button>
      </div>

      {summary && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6">
          <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
            <Brain size={20} /> Kết quả
          </h2>
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}
