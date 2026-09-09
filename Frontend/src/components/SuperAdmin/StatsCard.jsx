import React from 'react';
import { Building2, Users, GraduationCap, ShieldAlert, ArrowUpRight, TrendingUp } from 'lucide-react';
import '../../pages/SuperAdmin/Styles/SuperAdmin.css';

const iconMap = {
  Building2,
  Users,
  GraduationCap,
  ShieldAlert,
};

export default function StatsCard({ label, value, change, trend = 'up', icon = 'Building2' }) {
  const IconComponent = iconMap[icon] || Building2;

  const isWarning = trend === 'warning';
  const isUp = trend === 'up';

  return (
    <div className="sa-stats-card">
      <div className="flex items-center justify-between">
        <span className="sa-stats-label">{label}</span>
        <div className={`p-2.5 rounded-xl ${
          isWarning
            ? 'bg-amber-50 text-amber-600 border border-amber-200'
            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
        }`}>
          <IconComponent className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="sa-stats-val">{value}</h3>
        <p className="mt-1 text-xs flex items-center gap-1 font-medium">
          {isUp && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
          {isWarning && <TrendingUp className="w-3.5 h-3.5 text-amber-500" />}
          <span className={isWarning ? 'text-amber-600' : 'text-emerald-600'}>{change}</span>
        </p>
      </div>
    </div>
  );
}
