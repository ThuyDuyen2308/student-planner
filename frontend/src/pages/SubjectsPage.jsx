import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search } from 'lucide-react';
import { fetchSubjects } from '../services/subjectService';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadSubjects = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchSubjects(search);
        if (!cancelled) {
          setSubjects(data.subjects);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load subjects.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(loadSubjects, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subject Catalog</h1>
          <p className="mt-2 text-slate-400">
            Browse and search synchronized subjects from the master catalog.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            {search ? 'No subjects match your search.' : 'No subjects available yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-800/50"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{subject.subject_name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Code: <span className="font-mono text-indigo-300">{subject.subject_code}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                    {subject.credits} credits
                  </span>
                  <ChevronRight size={18} className="text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {!loading && subjects.length > 0 && (
        <p className="text-sm text-slate-500">
          Showing {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}
    </div>
  );
}
