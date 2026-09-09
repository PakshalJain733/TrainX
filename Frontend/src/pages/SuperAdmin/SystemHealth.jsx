import React, { useState } from 'react';
import {
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Cpu,
  Globe,
  Shield,
  Wifi,
  Search
} from 'lucide-react';
import './SuperAdmin.css';

const mockSystemHealth = {
  overallStatus: "Operational",
  uptime: "99.98%",
  avgLatency: "42ms",
  errorRate: "0.02%",
  services: [
    { id: 1, name: "Auth & Identity Gateway", category: "Core Service", status: "Operational", latency: "28ms", uptime: "99.99%", load: "18%" },
    { id: 2, name: "Database Cluster (PostgreSQL / MySQL)", category: "Storage", status: "Operational", latency: "14ms", uptime: "100%", load: "34%" },
    { id: 3, name: "AI Interview Engine", category: "AI Subsystem", status: "Operational", latency: "185ms", uptime: "99.95%", load: "52%" },
    { id: 4, name: "Coding Test Compiler & Runner", category: "Execution Sandbox", status: "Operational", latency: "95ms", uptime: "99.91%", load: "41%" },
    { id: 5, name: "AI Roadmap Generation Service", category: "AI Subsystem", status: "Operational", latency: "210ms", uptime: "99.88%", load: "29%" },
    { id: 6, name: "Student Analytics & Reporting API", category: "Analytics API", status: "Degraded Performance", latency: "340ms", uptime: "99.54%", load: "87%" },
    { id: 7, name: "Redis Cache & Session Store", category: "Caching", status: "Operational", latency: "4ms", uptime: "100%", load: "12%" }
  ],
  systemMetrics: {
    cpuUsage: "28%",
    memoryUsage: "4.2 GB / 16 GB",
    activeSockets: 1420,
    apiReqPerSec: "385 req/s"
  }
};

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(mockSystemHealth);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const filteredServices = healthData.services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>System Health & Infrastructure Monitoring</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time server latency, service status, database load, and API uptime monitoring
          </p>
        </div>
        <button onClick={handleRefresh} className="sa-btn-primary ml-auto" disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Health Status"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">System Uptime</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{healthData.uptime}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              ● All Systems Functional
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Avg API Latency</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{healthData.avgLatency}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-1">
              ⚡ Optimal Response Speed
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">Error Rate</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Zap size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{healthData.errorRate}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              Within Normal Limits
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="flex items-center justify-between">
            <span className="sa-stats-label">API Throughput</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Server size={18} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="sa-stats-val">{healthData.systemMetrics.apiReqPerSec}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 mt-1">
              Active Sockets: {healthData.systemMetrics.activeSockets}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="sa-search-card">
        <div className="sa-search-wrap" style={{ maxWidth: "100%" }}>
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search service name or infrastructure component..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sa-search-input"
          />
        </div>
      </div>

      {/* Infrastructure Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Microservice & Endpoint Status</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Live status ping</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">Service Name</th>
                <th className="py-3.5 px-5">Subsystem Category</th>
                <th className="py-3.5 px-5">Latency</th>
                <th className="py-3.5 px-5">30-Day Uptime</th>
                <th className="py-3.5 px-5">Resource Load</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`font-bold text-xs ${
                      parseInt(s.latency) < 50 ? 'text-emerald-700' :
                      parseInt(s.latency) < 200 ? 'text-indigo-700' : 'text-amber-700'
                    }`}>
                      {s.latency}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-800">{s.uptime}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${parseInt(s.load) > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: s.load }}
                        ></div>
                      </div>
                      <span className="font-bold text-xs text-slate-700">{s.load}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right">
                    {s.status === "Operational" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operational
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Degraded
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
