import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import { ShieldCheck, Building2, Calendar, CheckCircle2, RefreshCw, Mail } from 'lucide-react';

export default function AdminVerification() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = () => {
    setLoading(true);
    superAdminAPI.colleges()
      .then((colleges) => {
        if (!Array.isArray(colleges)) return;
        setAdmins(
          colleges
            .filter((c) => c.adminName && c.adminName !== '—')
            .map((c, i) => ({
              id: c.id,
              name: c.adminName,
              email: c.adminEmail || '—',
              college: c.name,
              designation: 'College Admin',
              date: String(c.created_at || 'Unknown').slice(0, 10),
              status: 'Registered',
            }))
        );
      })
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>College Admin Governance</span>
          </h2>
          <p className="text-xs text-slate-500">Registered college administrators with institutional access</p>
        </div>
        <button
          onClick={loadAdmins}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          There is currently no separate admin-verification workflow on the platform. The list below shows registered college administrators.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-slate-400 text-sm">Loading administrators…</div>
        ) : admins.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Registered College Admins"
            description="No college administrator accounts are registered yet. Admins can be created by a super admin via the admin user management flow."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                  <th className="py-3 px-4">Admin Name</th>
                  <th className="py-3 px-4">Institution / College</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{admin.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{admin.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.college}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{admin.designation}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.date}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {admin.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}