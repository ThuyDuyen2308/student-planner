import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Hash, Layers } from 'lucide-react';
import { fetchSubjectById } from '../services/subjectService';

export default function SubjectDetailPage() {
  const { id } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadSubject = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchSubjectById(id);
        if (!cancelled) {
          setSubject(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load subject details.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSubject();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/subjects"
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft size={16} />
          Back to subjects
        </Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/subjects"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
      >
        <ArrowLeft size={16} />
        Back to subjects
      </Link>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-xl bg-indigo-600 p-3">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{subject.subject_name}</h1>
            <p className="mt-2 font-mono text-indigo-300">{subject.subject_code}</p>
          </div>
        </div>

        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <dt className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Hash size={14} />
              Subject ID
            </dt>
            <dd className="text-lg font-semibold text-white">{subject.id}</dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5">
            <dt className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <Layers size={14} />
              Credits
            </dt>
            <dd className="text-lg font-semibold text-white">{subject.credits}</dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 sm:col-span-2">
            <dt className="mb-2 text-xs uppercase tracking-wide text-slate-500">Subject Code</dt>
            <dd className="font-mono text-lg text-indigo-300">{subject.subject_code}</dd>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 sm:col-span-2">
            <dt className="mb-2 text-xs uppercase tracking-wide text-slate-500">Subject Name</dt>
            <dd className="text-lg text-slate-200">{subject.subject_name}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
