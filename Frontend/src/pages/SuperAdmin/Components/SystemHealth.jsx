import React, { useState } from 'react';
import {
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';
import '../Styles/SuperAdmin.css';
import '../Styles/SystemHealth.css';

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
  const [healthData] = useState(mockSystemHealth);
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
    <div className="system-health-wrap">
      {/* Page Header */}
      <div className="sa-page-header">
        <div>
          <div className="system-health-title-wrap">
            <Activity className="system-health-title-icon" />
            <span className="system-health-title">System Health & Infrastructure Monitoring</span>
          </div>
          <p className="system-health-subtitle">
            Real-time server latency, service status, database load, and API uptime monitoring
          </p>
        </div>
        <button onClick={handleRefresh} className="sa-btn-primary" disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Health Status"}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">System Uptime</span>
            <div className="system-health-icon-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{healthData.uptime}</h3>
            <span className="system-health-tag-emerald">
              ● All Systems Functional
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Avg API Latency</span>
            <div className="system-health-icon-indigo">
              <Clock size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{healthData.avgLatency}</h3>
            <span className="system-health-tag-indigo">
              ⚡ Optimal Response Speed
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Error Rate</span>
            <div className="system-health-icon-amber">
              <Zap size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{healthData.errorRate}</h3>
            <span className="system-health-tag-emerald">
              Within Normal Limits
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">API Throughput</span>
            <div className="system-health-icon-purple">
              <Server size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{healthData.systemMetrics.apiReqPerSec}</h3>
            <span className="system-health-tag-purple">
              Active Sockets: {healthData.systemMetrics.activeSockets}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="sa-search-card">
        <div className="sa-search-wrap system-health-search-wrap">
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
      <div className="system-health-card">
        <div className="system-health-card-header">
          <h3 className="system-health-card-title">
            <Server size={16} className="system-health-title-icon" />
            <span>Microservice & Endpoint Status</span>
          </h3>
          <span className="system-health-card-sub">Live status ping</span>
        </div>

        <div className="system-health-table-wrap">
          <table className="system-health-table">
            <thead>
              <tr className="system-health-thead-row">
                <th className="system-health-th">Service Name</th>
                <th className="system-health-th">Subsystem Category</th>
                <th className="system-health-th">Latency</th>
                <th className="system-health-th">30-Day Uptime</th>
                <th className="system-health-th">Resource Load</th>
                <th className="system-health-th-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((s) => (
                <tr key={s.id} className="system-health-tr">
                  <td className="system-health-td">
                    <div className="system-health-service-name">{s.name}</div>
                  </td>
                  <td className="system-health-td">
                    <span className="system-health-category-pill">
                      {s.category}
                    </span>
                  </td>
                  <td className="system-health-td">
                    <span className={
                      parseInt(s.latency) < 50 ? 'system-health-latency-green' :
                      parseInt(s.latency) < 200 ? 'system-health-latency-indigo' : 'system-health-latency-amber'
                    }>
                      {s.latency}
                    </span>
                  </td>
                  <td className="system-health-td system-health-uptime-val">{s.uptime}</td>
                  <td className="system-health-td">
                    <div className="system-health-load-wrap">
                      <div className="system-health-load-bar-bg">
                        <div
                          className={`system-health-load-bar-fill ${parseInt(s.load) > 80 ? 'system-health-load-bar-fill--high' : 'system-health-load-bar-fill--normal'}`}
                          style={{ width: s.load }}
                        ></div>
                      </div>
                      <span className="system-health-load-text">{s.load}</span>
                    </div>
                  </td>
                  <td className="system-health-td-right">
                    {s.status === "Operational" ? (
                      <span className="system-health-status-op">
                        <span className="system-health-status-dot-op"></span> Operational
                      </span>
                    ) : (
                      <span className="system-health-status-deg">
                        <span className="system-health-status-dot-deg"></span> Degraded
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
