import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Trash2, Download } from 'lucide-react';
import api, { API_URL } from '../services/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subjectName, setSubjectName] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', title);
    if (subjectName) formData.append('subject_name', subjectName);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setTitle('');
      setSubjectName('');
      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi tải file lên');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa tài liệu này?')) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error(error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIconColor = (type) => {
    if (type === 'pdf') return 'text-red-400 bg-red-400/10';
    if (type === 'docx') return 'text-blue-400 bg-blue-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Quản lý Tài liệu</h1>
        <p className="mt-2 text-slate-400">Tải lên các file (PDF, DOCX, TXT) để lưu trữ và sử dụng AI phân tích.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 h-fit">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <UploadCloud className="text-indigo-400" /> Tải lên tài liệu
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tiêu đề *</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500" placeholder="Nhập tiêu đề tài liệu" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Môn học (Tùy chọn)</label>
              <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white outline-none focus:border-indigo-500" placeholder="VD: Lập trình Web" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">File *</label>
              <input required type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files[0])} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
            </div>
            <button type="submit" disabled={uploading || !file} className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 mt-4">
              {uploading ? 'Đang tải lên...' : 'Tải lên ngay'}
            </button>
          </form>
        </div>

        {/* Danh sách File */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white mb-6">Tài liệu của tôi</h2>
          
          {loading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/50">
              <FileText className="mx-auto mb-4 text-slate-500" size={48} />
              <p className="text-slate-400">Bạn chưa tải lên tài liệu nào.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {documents.map(doc => (
                <div key={doc.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl shrink-0 ${getFileIconColor(doc.filetype)}`}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate" title={doc.title}>{doc.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 uppercase">{doc.filetype} • {formatFileSize(doc.filesize)}</p>
                      {doc.subject_name && <p className="text-xs text-indigo-400 mt-1 truncate">{doc.subject_name}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end border-t border-slate-800/50 pt-3 mt-auto">
                    <a href={`${API_URL}/api/documents/${doc.id}/download`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded hover:bg-indigo-600 hover:text-white transition">
                      <Download size={14} /> Tải về
                    </a>
                    <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 rounded hover:bg-red-600 hover:text-white transition">
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
