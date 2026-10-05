import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Users,
  LogOut,
  Mail,
} from 'lucide-react';
import type { UserProfile, UserRole } from '../types';
import { Badge } from '../components/Badge';

interface ProfilePageProps {
  user: UserProfile;
  onUpdateRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateRole,
  onLogout,
}) => {
  const [name, setName] = useState(user.name);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c1626] via-[#091522] to-[#070e1c] border border-cyan-800/40 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-300 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-cyan-500/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={user.role === 'ADMIN' ? 'teal' : 'cyan'}>
                  Role: {user.role}
                </Badge>
                <Badge variant="teal">ID: Team 50</Badge>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {user.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-rose-900/60 hover:border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-800/60 flex items-center gap-2 text-xs text-teal-300">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Profile preferences saved successfully (Client State).</span>
        </div>
      )}

      {/* Profile Form & RBAC Simulator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" /> Account Identity
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Personal profile details scoped to your tenant ledger
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Role-Based Access Control (RBAC) Switcher */}
        <div className="bg-[#0c1322] border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" /> Role-Based Access Control (RBAC)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Test and toggle your active role to verify permissions
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">
                    Current Active Role:
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {user.role === 'ADMIN'
                      ? 'Elevated privilege: Can access platform telemetry and system audit logs.'
                      : 'Standard privilege: Confined strictly to own financial ledger.'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-1 bg-cyan-950/80 rounded border border-cyan-800">
                  {user.role}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateRole('USER')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    user.role === 'USER'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Set as USER
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateRole('ADMIN')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    user.role === 'ADMIN'
                      ? 'bg-teal-950 text-teal-300 border-teal-700 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Set as ADMIN
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Server verifies RBAC via JWT claims on every endpoint</span>
          </div>
        </div>
      </div>
    </div>
  );
};
