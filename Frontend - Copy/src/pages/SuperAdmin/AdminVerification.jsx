import React, { useState } from 'react';
import { initialAdminVerifications } from '../../data/superAdminMockData';
import StatusBadge from '../../components/SuperAdmin/StatusBadge';
import { ShieldCheck, CheckCircle2, XCircle, Mail, Building2, Calendar, Clock } from 'lucide-react';

export default function AdminVerification() {
  const [requests, setRequests] = useState(initialAdminVerifications);

  const handleVerify = (id) => {
    setRequests(requests.map((r) => r.id === id ? { ...r, status: 'Verified' } : r));
  };

  const handleReject = (id) => {
    setRequests(requests.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>College Admin Governance & Verification</span>
          </h2>
          <p className="text-xs text-slate-500">Review pending administrative sign-ups from college deans and placement heads</p>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          Verifying a request grants institutional administrative access to create departments, assign coordinators, and view student performance data.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Institution / College</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Requested On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{req.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{req.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{req.college}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{req.designation}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.requestedAt}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-200"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerify(req.id)}
                          className="px-3 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Access</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verified</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
