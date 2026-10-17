import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Activity,
  Server,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Database,
  Cpu,
  HardDrive,
  Globe,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  BarChart3,
  Pause,
  Play,
  Layers,
  Info,
  ExternalLink,
  Wifi,
  FileCode,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import CustomSelect from '../../../components/ui/CustomSelect';
import { apiFetch } from '../../../utils/api';
import "../Styles/SA_SystemHealth.css";

/* ── Status Helper Utilities ─────────────────────────────────────── */
function getStatusTheme(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'healthy' || s === 'operational' || s === 'connected' || s === 'reachable') {
    return {
      label: status || 'Operational',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      dotColor: '#10b981',
      badgeClass: 'status-badge-healthy',
      icon: CheckCircle2
    };
  }
  if (s === 'degraded' || s === 'warning') {
    return {
      label: status || 'Degraded',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      dotColor: '#f59e0b',
      badgeClass: 'status-badge-degraded',
      icon: AlertTriangle
    };
  }
  return {
    label: status || 'Unhealthy',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    dotColor: '#ef4444',
    badgeClass: 'status-badge-danger',
    icon: XCircle
  };
}

/* ── Custom Chart Tooltip ────────────────────────────────────────── */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="sh-chart-tooltip">
        <div className="sh-chart-tooltip-time">{label}</div>
        {payload.map((item, idx) => (
          <div key={idx} className="sh-chart-tooltip-row">
            <span
              className="sh-chart-tooltip-dot"
              style={{ backgroundColor: item.color || item.stroke }}
            />
            <span className="sh-chart-tooltip-name">{item.name}:</span>
            <span className="sh-chart-tooltip-val">
              {typeof item.value === 'number'
                ? item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                : item.value}
              {item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* ── Main Component ──────────────────────────────────────────────── */
export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(15); // seconds: 15, 30, 60, or 0 (paused)
  const [chartMetricTab, setChartMetricTab] = useState('resources'); // 'resources' | 'latency' | 'throughput'
  const [errorLogTab, setErrorLogTab] = useState('errors'); // 'errors' | 'slowRequests'
  const [searchQuery, setSearchQuery] = useState('');

  const isMountedRef = useRef(true);
  const activeFetchPromiseRef = useRef(null);

  // Fetch metrics handler
  const fetchAllMetrics = useCallback(async (isManual = false) => {
    // Avoid overlapping requests
    if (activeFetchPromiseRef.current) return;

    if (isManual) setIsRefreshing(true);
    setErrorMessage(null);

    const fetchPromise = (async () => {
      try {
        // Fetch current health data
        let res = await apiFetch('/admin/system-health');
        if (!res || !res.data) {
          res = await apiFetch('/system/health');
        }

        if (res && res.data && isMountedRef.current) {
          setHealthData(res.data);
          setLastUpdated(new Date().toLocaleTimeString());
        }

        // Fetch history data for charts
        try {
          const histRes = await apiFetch('/admin/system-health/history');
          if (histRes && histRes.data && Array.isArray(histRes.data.history) && isMountedRef.current) {
            // Normalize history items for recharts using the client browser's local timezone
            const normalized = histRes.data.history.map(item => {
              const d = new Date(item.timestamp || item.isoTime || Date.now());
              const timeLabel = !isNaN(d.getTime())
                ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : (item.timeLabel || '');

              return {
                ...item,
                timeLabel,
                cpuUsage: item.cpuPercent ?? item.cpuUsage ?? 0,
                memoryUsage: item.memoryPercent ?? item.memoryUsage ?? 0,
                avgLatency: item.avgLatencyMs ?? item.avgLatency ?? 0,
                reqCount: item.requestCount ?? item.reqCount ?? 0,
                errorRate: item.errorRatePercent ?? item.errorRate ?? 0,
              };
            });
            setHistoryData(normalized);
          }
        } catch (hErr) {
          console.warn("History metrics could not be fetched:", hErr);
        }
      } catch (err) {
        console.error("Error fetching live system health:", err);
        if (isMountedRef.current) {
          setErrorMessage(err.message || "Failed to fetch live system telemetry. Retrying...");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsRefreshing(false);
          activeFetchPromiseRef.current = null;
        }
      }
    })();

    activeFetchPromiseRef.current = fetchPromise;
    await fetchPromise;
  }, []);

  // Set up auto-refresh timer with cleanup
  useEffect(() => {
    isMountedRef.current = true;
    fetchAllMetrics(false);

    if (autoRefreshInterval <= 0) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllMetrics(false);
      }
    }, autoRefreshInterval * 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchAllMetrics, autoRefreshInterval]);

  // Filter microservices
  const filteredServices = useMemo(() => {
    const services = healthData?.services || [];
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.metricDetails && s.metricDetails.toLowerCase().includes(q))
    );
  }, [healthData?.services, searchQuery]);

  // Overall status theme
  const overallTheme = getStatusTheme(healthData?.overallStatus || 'Healthy');
  const OverallIcon = overallTheme.icon;

  // Extracted telemetry metrics with fallbacks
  const cpuPercent = healthData?.serverResources?.cpu?.loadPercent ?? healthData?.serverResources?.cpuUsagePercent ?? 0;
  const cpuCores = healthData?.serverResources?.cpu?.cores ?? healthData?.serverResources?.cpuCores ?? 4;
  const cpuModel = healthData?.serverResources?.cpu?.model ?? healthData?.serverResources?.cpuModel ?? "Multi-Core Host Processor";

  const memTotalGB = healthData?.serverResources?.memory?.totalGB ?? 0;
  const memUsedGB = healthData?.serverResources?.memory?.usedGB ?? 0;
  const memFreeGB = healthData?.serverResources?.memory?.freeGB ?? 0;
  const memPercent = healthData?.serverResources?.memory?.usedPercent ?? healthData?.serverResources?.memory?.usagePercent ?? 0;

  const diskData = healthData?.serverResources?.disk;
  const diskAvailable = Boolean(diskData && diskData.totalGB);
  const diskTotalGB = diskData?.totalGB ?? 0;
  const diskUsedGB = diskData?.usedGB ?? 0;
  const diskFreeGB = diskData?.freeGB ?? 0;
  const diskPercent = diskData?.usePercent ?? diskData?.usagePercent ?? 0;

  const dbPing = healthData?.database?.pingLatencyMs ?? healthData?.database?.latencyMs ?? 1;
  const dbCounts = healthData?.database?.counts || healthData?.database?.entities || {};
  const dbStatus = healthData?.database?.status || "Connected";

  const feUrl = healthData?.frontend?.checkedUrl || healthData?.frontend?.url || "http://localhost:5173";
  const feLatency = healthData?.frontend?.latencyMs ?? 0;
  const feStatus = healthData?.frontend?.status || "Reachable";
  const feStatusCode = healthData?.frontend?.statusCode || 200;

  const beUptime = healthData?.backend?.formattedUptime || healthData?.backend?.uptimeFormatted || healthData?.uptime || "Operational";
  const beStatus = healthData?.backend?.status || "Operational";
  const beHeapUsed = healthData?.backend?.processMemory?.heapUsedMB ?? 0;
  const beHeapTotal = healthData?.backend?.processMemory?.heapTotalMB ?? 0;
  const beRss = healthData?.backend?.processMemory?.rssMB ?? 0;
  const beNodeVersion = healthData?.backend?.nodeVersion || "Node.js v20+";

  const apiThroughput = healthData?.apiPerformance?.throughputReqPerSec ?? 0;
  const apiAvgLatency = healthData?.apiPerformance?.avgResponseTimeMs ?? (parseInt(healthData?.avgLatency) || 0);
  const apiTotalReqs = healthData?.apiPerformance?.totalRequests ?? 0;
  const apiErrRate = healthData?.apiPerformance?.errorRatePercent ?? 0;
  const api4xx = healthData?.apiPerformance?.clientErrors4xx ?? healthData?.errorMonitoring?.clientErrors4xxCount ?? 0;
  const api5xx = healthData?.apiPerformance?.serverErrors5xx ?? healthData?.errorMonitoring?.serverErrors5xxCount ?? 0;

  const recentErrors = healthData?.errorMonitoring?.recentErrors || [];
  const slowRequests = healthData?.apiPerformance?.slowRequests || healthData?.errorMonitoring?.slowRequests || [];

  return (
    <div className="sh-container">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="sh-header-bar">
        <div className="sh-header-left">
          <div className="sh-title-row">
            <div className="sh-title-icon-box">
              <Activity size={22} className="sh-title-icon" />
            </div>
            <div>
              <h1 className="sh-page-title">Real-Time System Health &amp; Infrastructure</h1>
              <p className="sh-page-subtitle">
                Live hardware telemetry, database connection integrity, and API performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="sh-header-actions">
          {/* Auto Refresh Toggle */}
          <div className="sh-refresh-picker">
            <span className="sh-refresh-label">
              {autoRefreshInterval > 0 ? (
                <Play size={12} className="sh-pulse-green" />
              ) : (
                <Pause size={12} className="sh-pause-icon" />
              )}
              Auto Refresh:
            </span>
            <div className="sh-refresh-dropdown-wrap">
              <CustomSelect
                value={autoRefreshInterval}
                onChange={(val) => setAutoRefreshInterval(Number(val))}
                options={[
                  { value: 15, label: "Every 15s" },
                  { value: 30, label: "Every 30s" },
                  { value: 60, label: "Every 60s" },
                  { value: 0, label: "Paused" },
                ]}
                className="sh-refresh-custom-select"
              />
            </div>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchAllMetrics(true)}
            className="sh-btn-refresh"
            disabled={isRefreshing}
            title="Poll immediate telemetry from all subsystems"
          >
            <RefreshCw size={15} className={isRefreshing ? "sh-spin" : ""} />
            <span>{isRefreshing ? "Checking..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner (if any) ──────────────────────────────────── */}
      {errorMessage && (
        <div className="sh-alert-banner">
          <AlertCircle size={18} className="sh-alert-icon" />
          <div className="sh-alert-text">
            <strong>Telemetry Alert:</strong> {errorMessage}
          </div>
          <button onClick={() => fetchAllMetrics(true)} className="sh-alert-retry-btn">
            Retry Now
          </button>
        </div>
      )}

      {/* ── Section A: Overall System Status Card ──────────────────── */}
      <div className="sh-card sh-overall-banner">
        <div className="sh-overall-main">
          <div className="sh-overall-badge-wrap">
            <div
              className="sh-overall-status-pill"
              style={{
                backgroundColor: overallTheme.bg,
                borderColor: overallTheme.border,
                color: overallTheme.color
              }}
            >
              <span
                className="sh-pulse-dot"
                style={{ backgroundColor: overallTheme.dotColor }}
              />
              <OverallIcon size={16} />
              <span className="sh-overall-status-text">
                {loading ? "Diagnosing Systems..." : `System ${overallTheme.label}`}
              </span>
            </div>
            <div className="sh-overall-reason">
              {loading
                ? "Connecting to telemetry subsystem..."
                : (healthData?.statusReason || healthData?.overallReason || "All system services and dependencies are fully operational.")}
            </div>
          </div>

          <div className="sh-overall-meta">
            <div className="sh-meta-item">
              <Clock size={14} className="sh-meta-icon" />
              <span>Last Checked: <strong>{lastUpdated || "Just now"}</strong></span>
            </div>
            <div className="sh-meta-item">
              <Wifi size={14} className="sh-meta-icon" />
              <span>Response: <strong>{healthData?.avgLatency || `${apiAvgLatency}ms`}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections B, C, D, F: 4 Core Health KPI Cards ────────────── */}
      <div className="sh-kpi-grid">
        {/* Card 1: Frontend Health */}
        <div className="sh-card sh-kpi-card">
          <div className="sh-kpi-card-header">
            <div className="sh-kpi-title-wrap">
              <span className="sh-kpi-label">Frontend Web App</span>
              <span className="sh-kpi-sub">Client Availability</span>
            </div>
            <div className="sh-kpi-icon-box sh-icon-sky">
              <Globe size={18} />
            </div>
          </div>

          <div className="sh-kpi-card-body">
            <div className="sh-kpi-value-row">
              <h3 className="sh-kpi-val">
                {loading ? "..." : feStatus}
              </h3>
              <span
                className={`sh-status-pill ${
                  feStatus === 'Reachable' ? 'sh-pill-green' : 'sh-pill-amber'
                }`}
              >
                ● HTTP {feStatusCode}
              </span>
            </div>

            <div className="sh-kpi-details">
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Target URL:</span>
                <span className="sh-detail-val sh-truncate" title={feUrl}>
                  {feUrl}
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Probe Latency:</span>
                <span className="sh-detail-val">
                  {feLatency} ms
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Verification:</span>
                <span className="sh-detail-val text-muted">
                  External HTTP Probe
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Backend API Health */}
        <div className="sh-card sh-kpi-card">
          <div className="sh-kpi-card-header">
            <div className="sh-kpi-title-wrap">
              <span className="sh-kpi-label">Backend API Server</span>
              <span className="sh-kpi-sub">Express.js Engine</span>
            </div>
            <div className="sh-kpi-icon-box sh-icon-indigo">
              <Server size={18} />
            </div>
          </div>

          <div className="sh-kpi-card-body">
            <div className="sh-kpi-value-row">
              <h3 className="sh-kpi-val">
                {loading ? "..." : beStatus}
              </h3>
              <span className="sh-status-pill sh-pill-green">
                ● Active
              </span>
            </div>

            <div className="sh-kpi-details">
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Process Uptime:</span>
                <span className="sh-detail-val font-semibold">
                  {beUptime}
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Heap Memory:</span>
                <span className="sh-detail-val">
                  {beHeapUsed ? `${beHeapUsed} MB / ${beHeapTotal} MB` : "Dynamic"}
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Node Runtime:</span>
                <span className="sh-detail-val">
                  {beNodeVersion}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Database Health */}
        <div className="sh-card sh-kpi-card">
          <div className="sh-kpi-card-header">
            <div className="sh-kpi-title-wrap">
              <span className="sh-kpi-label">MySQL Database</span>
              <span className="sh-kpi-sub">Connection Pool &amp; Query Ping</span>
            </div>
            <div className="sh-kpi-icon-box sh-icon-emerald">
              <Database size={18} />
            </div>
          </div>

          <div className="sh-kpi-card-body">
            <div className="sh-kpi-value-row">
              <h3 className="sh-kpi-val">
                {loading ? "..." : dbStatus}
              </h3>
              <span
                className={`sh-status-pill ${
                  dbStatus === 'Connected' ? 'sh-pill-green' : 'sh-pill-red'
                }`}
              >
                ● Ping: {dbPing} ms
              </span>
            </div>

            <div className="sh-kpi-details">
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Query Verified:</span>
                <span className="sh-detail-val code-font">
                  SELECT 1
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Live Entities:</span>
                <span className="sh-detail-val">
                  {dbCounts.users !== undefined
                    ? `${dbCounts.users} Users, ${dbCounts.colleges || 0} Colleges, ${dbCounts.batches || 0} Batches`
                    : "Pool Active"}
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Security:</span>
                <span className="sh-detail-val text-green font-semibold">
                  Credentials Sanitized
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: API Performance & Error Rate */}
        <div className="sh-card sh-kpi-card">
          <div className="sh-kpi-card-header">
            <div className="sh-kpi-title-wrap">
              <span className="sh-kpi-label">API Throughput &amp; Health</span>
              <span className="sh-kpi-sub">Traffic &amp; Error Rate</span>
            </div>
            <div className="sh-kpi-icon-box sh-icon-purple">
              <Zap size={18} />
            </div>
          </div>

          <div className="sh-kpi-card-body">
            <div className="sh-kpi-value-row">
              <h3 className="sh-kpi-val">
                {loading ? "..." : `${apiThroughput} req/s`}
              </h3>
              <span
                className={`sh-status-pill ${
                  apiErrRate < 5 ? 'sh-pill-green' : 'sh-pill-amber'
                }`}
              >
                ● Error: {apiErrRate}%
              </span>
            </div>

            <div className="sh-kpi-details">
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Total Served:</span>
                <span className="sh-detail-val">
                  {apiTotalReqs} requests
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Average Latency:</span>
                <span className="sh-detail-val">
                  {apiAvgLatency} ms
                </span>
              </div>
              <div className="sh-kpi-detail-row">
                <span className="sh-detail-name">Errors Breakdown:</span>
                <span className="sh-detail-val">
                  {api4xx} (4xx) • {api5xx} (5xx)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section E: Server Resource Monitoring (Hardware Telemetry) ─ */}
      <div className="sh-card sh-telemetry-card">
        <div className="sh-card-header">
          <div className="sh-card-title-group">
            <Cpu size={18} className="sh-title-icon-blue" />
            <h2 className="sh-card-title">Server Resource Telemetry</h2>
            <span className="sh-badge-subtle">
              systeminformation + Node Process Metrics
            </span>
          </div>
          <div className="sh-card-header-note">
            OS Uptime: <strong>{healthData?.serverResources?.systemUptime || "Host Operational"}</strong>
          </div>
        </div>

        <div className="sh-telemetry-grid">
          {/* CPU Metric Box */}
          <div className="sh-telemetry-box">
            <div className="sh-tel-header">
              <span className="sh-tel-label">CPU Utilization</span>
              <span className="sh-tel-num font-bold">
                {cpuPercent}%
              </span>
            </div>
            <div className="sh-progress-bar-bg">
              <div
                className={`sh-progress-bar-fill ${
                  cpuPercent > 80
                    ? 'fill-danger'
                    : cpuPercent > 50
                    ? 'fill-warning'
                    : 'fill-primary'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, cpuPercent))}%` }}
              />
            </div>
            <div className="sh-tel-subtext">
              <span>{cpuCores} CPU Cores</span>
              <span className="sh-truncate" title={cpuModel}>
                {cpuModel}
              </span>
            </div>
          </div>

          {/* Machine Memory Metric Box */}
          <div className="sh-telemetry-box">
            <div className="sh-tel-header">
              <span className="sh-tel-label">System Memory (RAM)</span>
              <span className="sh-tel-num font-bold">
                {memPercent}%
              </span>
            </div>
            <div className="sh-progress-bar-bg">
              <div
                className={`sh-progress-bar-fill ${
                  memPercent > 85 ? 'fill-danger' : 'fill-indigo'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, memPercent))}%` }}
              />
            </div>
            <div className="sh-tel-subtext">
              <span>
                Used: {memUsedGB} GB / {memTotalGB} GB
              </span>
              <span>Free: {memFreeGB} GB</span>
            </div>
          </div>

          {/* Node.js Process Memory Box */}
          <div className="sh-telemetry-box">
            <div className="sh-tel-header">
              <span className="sh-tel-label">Node.js Process Heap</span>
              <span className="sh-tel-num font-bold">
                {beHeapUsed} MB
              </span>
            </div>
            <div className="sh-progress-bar-bg">
              <div
                className="sh-progress-bar-fill fill-emerald"
                style={{
                  width: `${Math.min(
                    100,
                    beHeapTotal
                      ? Math.round((beHeapUsed / beHeapTotal) * 100)
                      : 35
                  )}%`
                }}
              />
            </div>
            <div className="sh-tel-subtext">
              <span>Heap Allocated: {beHeapTotal} MB</span>
              <span>RSS: {beRss} MB</span>
            </div>
          </div>

          {/* Disk Usage Metric Box */}
          <div className="sh-telemetry-box">
            <div className="sh-tel-header">
              <span className="sh-tel-label">Persistent Disk Storage</span>
              <span className="sh-tel-num font-bold">
                {diskAvailable ? `${diskPercent}%` : "Managed"}
              </span>
            </div>
            {diskAvailable ? (
              <>
                <div className="sh-progress-bar-bg">
                  <div
                    className={`sh-progress-bar-fill ${
                      diskPercent > 85 ? 'fill-danger' : 'fill-purple'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, diskPercent))}%` }}
                  />
                </div>
                <div className="sh-tel-subtext">
                  <span>
                    Used: {diskUsedGB} GB / {diskTotalGB} GB
                  </span>
                  <span>Free: {diskFreeGB} GB</span>
                </div>
              </>
            ) : (
              <div className="sh-tel-subtext sh-env-notice">
                Unavailable on this hosting environment
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Historical Trends (Charts via Recharts) ────────── */}
      <div className="sh-card sh-chart-card">
        <div className="sh-card-header">
          <div className="sh-card-title-group">
            <BarChart3 size={18} className="sh-title-icon-indigo" />
            <h2 className="sh-card-title">Historical Telemetry &amp; Performance Trends</h2>
            <span className="sh-badge-subtle">Real-Time Ring Buffer ({historyData.length} Data Points)</span>
          </div>

          {/* Metric Selector Tabs */}
          <div className="sh-chart-tabs">
            <button
              onClick={() => setChartMetricTab('resources')}
              className={`sh-chart-tab-btn ${chartMetricTab === 'resources' ? 'active' : ''}`}
            >
              CPU &amp; Memory
            </button>
            <button
              onClick={() => setChartMetricTab('latency')}
              className={`sh-chart-tab-btn ${chartMetricTab === 'latency' ? 'active' : ''}`}
            >
              API Response Latency
            </button>
            <button
              onClick={() => setChartMetricTab('throughput')}
              className={`sh-chart-tab-btn ${chartMetricTab === 'throughput' ? 'active' : ''}`}
            >
              Throughput &amp; Errors
            </button>
          </div>
        </div>

        <div className="sh-chart-body">
          {historyData.length === 0 ? (
            <div className="sh-chart-empty">
              <RefreshCw size={24} className="sh-spin text-muted" />
              <span>Collecting historical metric samples...</span>
            </div>
          ) : (
            <div className="sh-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                {chartMetricTab === 'resources' ? (
                  <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="cpuUsage"
                      name="CPU Load"
                      unit="%"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#cpuGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="memoryUsage"
                      name="RAM Usage"
                      unit="%"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#memGrad)"
                    />
                  </AreaChart>
                ) : chartMetricTab === 'latency' ? (
                  <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="ms" />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="avgLatency"
                      name="API Latency"
                      unit=" ms"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#latencyGrad)"
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area
                      type="monotone"
                      dataKey="reqCount"
                      name="Requests per Interval"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#reqGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="errorRate"
                      name="Error Rate"
                      unit="%"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#errGrad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Section G: Error Monitoring & Slow Requests Panel ──────── */}
      <div className="sh-card sh-errors-card">
        <div className="sh-card-header">
          <div className="sh-card-title-group">
            <ShieldAlert size={18} className="sh-title-icon-amber" />
            <h2 className="sh-card-title">Sanitized Anomaly &amp; Error Monitoring</h2>
            <span className="sh-badge-subtle">Zero Secrets or Sensitive Payloads</span>
          </div>

          <div className="sh-tabs-pill">
            <button
              onClick={() => setErrorLogTab('errors')}
              className={`sh-pill-btn ${errorLogTab === 'errors' ? 'active' : ''}`}
            >
              Recent Errors ({recentErrors.length})
            </button>
            <button
              onClick={() => setErrorLogTab('slowRequests')}
              className={`sh-pill-btn ${errorLogTab === 'slowRequests' ? 'active' : ''}`}
            >
              Slow API Calls ({slowRequests.length})
            </button>
          </div>
        </div>

        <div className="sh-card-body-tight">
          {errorLogTab === 'errors' ? (
            <div className="sh-table-wrap">
              {recentErrors.length === 0 ? (
                <div className="sh-empty-state">
                  <ShieldCheck size={32} className="text-emerald" />
                  <span className="font-semibold text-slate">No recent application errors recorded.</span>
                  <span className="text-xs text-muted">All endpoints are responding with healthy status codes.</span>
                </div>
              ) : (
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Method</th>
                      <th>Route / Endpoint</th>
                      <th>Status</th>
                      <th>Sanitized Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentErrors.map((err, i) => (
                      <tr key={err.id || i}>
                        <td className="text-muted text-nowrap">
                          {new Date(err.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          <span className={`sh-method-badge method-${err.method?.toLowerCase()}`}>
                            {err.method}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{err.path}</td>
                        <td>
                          <span
                            className={`sh-status-pill ${
                              err.status >= 500 ? 'sh-pill-red' : 'sh-pill-amber'
                            }`}
                          >
                            HTTP {err.status}
                          </span>
                        </td>
                        <td className="text-slate text-xs">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="sh-table-wrap">
              {slowRequests.length === 0 ? (
                <div className="sh-empty-state">
                  <CheckCircle2 size={32} className="text-emerald" />
                  <span className="font-semibold text-slate">No slow requests (&gt;300ms) observed recently.</span>
                  <span className="text-xs text-muted">Fast database execution and efficient response buffering.</span>
                </div>
              ) : (
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Method</th>
                      <th>Route / Endpoint</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowRequests.map((req, i) => (
                      <tr key={req.id || i}>
                        <td className="text-muted text-nowrap">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </td>
                        <td>
                          <span className={`sh-method-badge method-${req.method?.toLowerCase()}`}>
                            {req.method}
                          </span>
                        </td>
                        <td className="font-mono text-xs">{req.path}</td>
                        <td>
                          <span className="sh-status-pill sh-pill-amber font-semibold">
                            {typeof req.durationMs === 'number' ? Math.round(req.durationMs) : req.durationMs} ms
                          </span>
                        </td>
                        <td>
                          <span
                            className={`sh-status-pill ${
                              (req.statusCode || req.status) < 400 ? 'sh-pill-green' : 'sh-pill-red'
                            }`}
                          >
                            HTTP {req.statusCode || req.status || 200}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Subsystems Directory Search & Table ─────────────────────── */}
      <div className="sh-card sh-services-card">
        <div className="sh-card-header">
          <div className="sh-card-title-group">
            <Layers size={18} className="sh-title-icon-purple" />
            <h2 className="sh-card-title">Subsystem &amp; Microservice Directory</h2>
            <span className="sh-badge-subtle">
              {filteredServices.length} Subsystems Monitored
            </span>
          </div>

          <div className="sh-search-box">
            <Search size={14} className="sh-search-icon" />
            <input
              type="text"
              placeholder="Search services or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sh-search-input"
            />
          </div>
        </div>

        <div className="sh-table-wrap">
          <table className="sh-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Subsystem Category</th>
                <th>Ping Latency</th>
                <th>30-Day Uptime</th>
                <th>Resource Load</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((svc) => (
                <tr key={svc.id}>
                  <td>
                    <div className="sh-svc-name">{svc.name}</div>
                    {svc.metricDetails && (
                      <div className="sh-svc-subtext">{svc.metricDetails}</div>
                    )}
                  </td>
                  <td>
                    <span className="sh-category-tag">{svc.category}</span>
                  </td>
                  <td>
                    <span
                      className={`font-semibold ${
                        parseInt(svc.latency) < 50
                          ? 'text-emerald'
                          : parseInt(svc.latency) < 150
                          ? 'text-indigo'
                          : 'text-amber'
                      }`}
                    >
                      {svc.latency}
                    </span>
                  </td>
                  <td className="font-semibold text-slate">{svc.uptime}</td>
                  <td>
                    <div className="sh-load-bar-wrap">
                      <div className="sh-load-bar-track">
                        <div
                          className={`sh-load-bar-val ${
                            parseInt(svc.load) > 75 ? 'fill-amber' : 'fill-indigo'
                          }`}
                          style={{ width: svc.load }}
                        />
                      </div>
                      <span className="sh-load-text">{svc.load}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <span
                      className={`sh-status-pill ${
                        svc.status === 'Operational' ? 'sh-pill-green' : 'sh-pill-amber'
                      }`}
                    >
                      ● {svc.status}
                    </span>
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
