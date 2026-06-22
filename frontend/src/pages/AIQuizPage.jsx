import { useState, useEffect } from 'react';
import { Target, FileText, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function AIQuizPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(() => sessionStorage.getItem('aiQuiz_selectedDoc') || '');
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(() => {
    const saved = sessionStorage.getItem('aiQuiz_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('aiQuiz_selectedDoc', selectedDoc);
    if (quizData) {
      sessionStorage.setItem('aiQuiz_data', JSON.stringify(quizData));
    } else {
      sessionStorage.removeItem('aiQuiz_data');
    }
  }, [selectedDoc, quizData]);

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

  const handleGenerate = async () => {
    if (!selectedDoc) {
      setError('Vui lòng chọn tài liệu để sinh câu hỏi.');
      return;
    }
    setError('');
    setLoading(true);
    setQuizData(null);

    try {
      const res = await api.post('/ai/quiz', { documentId: selectedDoc });
      setQuizData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi sinh câu hỏi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Target className="text-rose-400" /> AI Sinh câu hỏi ôn tập
        </h1>
        <p className="mt-2 text-slate-400">Tự động tạo câu hỏi trắc nghiệm, tự luận và flashcard từ tài liệu học tập.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex-1 w-full">
          <label className="mb-2 block text-sm font-medium text-slate-300">Chọn tài liệu</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-white outline-none focus:border-rose-500 appearance-none"
            >
              <option value="">-- Chọn tài liệu --</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || documents.length === 0}
          className="w-full sm:w-auto px-6 rounded-lg bg-rose-600 py-2.5 font-medium text-white transition hover:bg-rose-500 disabled:opacity-50 shrink-0"
        >
          {loading ? 'Đang tạo...' : 'Tạo bộ câu hỏi'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {quizData && (
        <div className="space-y-8">
          {/* Trắc nghiệm */}
          {quizData.mcq && quizData.mcq.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Câu hỏi Trắc nghiệm</h2>
              <div className="space-y-6">
                {quizData.mcq.map((q, i) => (
                  <div key={i} className="space-y-3">
                    <p className="font-medium text-slate-200">Câu {i + 1}: {q.question}</p>
                    <div className="grid sm:grid-cols-2 gap-2 pl-4">
                      {q.options.map((opt, j) => (
                        <div key={j} className="text-slate-400 text-sm p-2 rounded bg-slate-950/50 border border-slate-800">
                          {opt}
                        </div>
                      ))}
                    </div>
                    <p className="text-emerald-400 text-sm font-medium flex items-center gap-1 pl-4 mt-2">
                      <CheckCircle2 size={16} /> Đáp án: {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tự luận */}
          {quizData.essay && quizData.essay.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Câu hỏi Tự luận</h2>
              <ul className="list-decimal pl-5 space-y-3 text-slate-300">
                {quizData.essay.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Flashcard */}
          {quizData.flashcard && quizData.flashcard.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-2">Flashcard</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {quizData.flashcard.map((f, i) => (
                  <div key={i} className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 relative group cursor-pointer h-32 flex items-center justify-center text-center [perspective:1000px]">
                    <div className="w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 flex items-center justify-center p-4 [backface-visibility:hidden]">
                        <p className="text-slate-200 font-medium">{f.front}</p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] text-emerald-400">
                        <p className="font-medium">{f.back}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-slate-500 text-sm mt-4 italic">Di chuột qua Flashcard để xem đáp án.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
