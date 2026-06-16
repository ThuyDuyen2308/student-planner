import { Outlet } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <BookOpen className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-white">Student Planner</h1>
          <p className="mt-2 text-sm text-slate-400">Phase 1 — Authentication</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
