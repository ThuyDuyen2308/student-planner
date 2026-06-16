import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const infoItems = [
    { label: 'Username', value: user?.username, icon: User },
    { label: 'Full name', value: user?.fullname || 'Not set', icon: User },
    { label: 'Email', value: user?.email || 'Not set', icon: User },
    { label: 'Role', value: user?.role || 'user', icon: Shield },
    {
      label: 'Member since',
      value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—',
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {user?.username}!</h1>
        <p className="mt-2 text-slate-400">
          Browse the synchronized subject catalog or manage your account from here.
        </p>
        <Link
          to="/subjects"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <BookOpen size={16} />
          View Subjects
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Your profile</h2>
          <dl className="space-y-4">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <Icon size={16} />
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium capitalize text-slate-200">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-slate-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Phase 1 scope</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              User registration with bcrypt password hashing
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              JWT login and protected API routes
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Logout and client-side session management
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Subject catalog: view, search, and detail pages
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Future phases: schedules, assignments, and more
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
