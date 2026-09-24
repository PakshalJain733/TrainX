import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Database,
  Cpu
} from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import "../Styles/SA_SystemHealth.css";

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchHealthMetrics = async () => {
    setIsRefreshing(true);
    try {
      let res = await apiFetch('/system/health');
      if (!res || !res.data) {
        res = await apiFetch('/api/v1/system/health');
      }
      if (res && res.data) {
        setHealthData(res.data);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching live system health:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    const interval = setInterval(fetchHealthMetrics, 15000); // Live ping every 15s
    return () => clearInterval(interval);
  }, []);

  const filteredServices = (healthData?.services || []).filter((s) =>
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
            {lastUpdated && ` • Updated at ${lastUpdated}`}
          </p>
        </div>
        <button onClick={fetchHealthMetrics} className="sa-btn-primary" disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Pinging Server..." : "Refresh Health Status"}</span>
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
            <h3 className="sa-stats-val">{loading ? "..." : (healthData?.uptime || "99.98%")}</h3>
            <span className="system-health-tag-emerald">
              ● {healthData?.overallStatus === "Operational" ? "All Systems Functional" : "Monitoring Active"}
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
            <h3 className="sa-stats-val">{loading ? "..." : (healthData?.avgLatency || "0ms")}</h3>
            <span className="system-health-tag-indigo">
              ⚡ Optimal Response Speed
            </span>
          </div>
        </div>

        <div className="sa-stats-card">
          <div className="sa-stats-card-header">
            <span className="sa-stats-label">Server Memory & CPU</span>
            <div className="system-health-icon-amber">
              <Cpu size={18} />
            </div>
          </div>
          <div className="sa-stats-card-body">
            <h3 className="sa-stats-val">{loading ? "..." : (healthData?.systemMetrics?.memoryUsage || "0 GB / 0 GB")}</h3>
            <span className="system-health-tag-emerald">
              CPU Load: {healthData?.systemMetrics?.cpuUsage || "0%"}
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
            <h3 className="sa-stats-val">{loading ? "..." : (healthData?.systemMetrics?.apiReqPerSec || "0 req/s")}</h3>
            <span className="system-health-tag-purple">
              Active Sockets: {healthData?.systemMetrics?.activeSockets || 0}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2 font-semibold text-sm">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <span>Pinging live infrastructure microservices...</span>
            </div>
          ) : (
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
                      {s.metricDetails && (
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">{s.metricDetails}</div>
                      )}
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
          )}
        </div>
      </div>
    </div>
  );
}
