import React from "react";
import { Link } from "react-router-dom";
import { Wrench, ShieldAlert, Clock, Sparkles, ArrowLeft, Headphones } from "lucide-react";
import { useSystemMaintenance } from "../../context/SystemMaintenanceContext";

export default function MaintenanceGuard({ moduleKey, children }) {
  const { isModuleActive, getModuleConfig } = useSystemMaintenance();

  const active = isModuleActive(moduleKey);

  if (active) {
    return <>{children}</>;
  }

  const moduleConfig = getModuleConfig(moduleKey);

  return (
    <div
      style={{
        minHeight: "65vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "36px 30px",
          textAlign: "center",
          boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
          position: "relative",
          overflow: "hidden",
          color: "#0f172a",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Subtle Decorative Gradient Accents */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            left: "-50px",
            width: "140px",
            height: "140px",
            background: "rgba(79, 70, 229, 0.06)",
            borderRadius: "50%",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            right: "-50px",
            width: "140px",
            height: "140px",
            background: "rgba(239, 68, 68, 0.06)",
            borderRadius: "50%",
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />

        {/* Maintenance Icon Badge */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              margin: "0 auto",
              boxShadow: "0 4px 12px rgba(217, 119, 6, 0.1)",
            }}
          >
            <Wrench size={34} />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#ffffff",
              borderRadius: "50%",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
            }}
          >
            <ShieldAlert size={13} />
          </div>
        </div>

        {/* Status Pill Tag */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "9999px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#b45309",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.2px",
            }}
          >
            <Sparkles size={13} style={{ color: "#d97706" }} />
            <span>Scheduled Maintenance Mode</span>
          </div>
        </div>

        {/* Title & Role Target */}
        <h2 style={{ fontSize: "21px", fontWeight: 800, margin: "0 0 6px 0", color: "#0f172a", letterSpacing: "-0.02em" }}>
          {moduleConfig.name || "Module Temporarily Offline"}
        </h2>
        <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 22px 0", fontWeight: 500 }}>
          Role Target: <span style={{ color: "#475569", fontWeight: 700 }}>{moduleConfig.role || "Platform System"}</span>
        </p>

        {/* Notice Box */}
        <div
          style={{
            padding: "16px 18px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            textAlign: "left",
            marginBottom: "24px",
            fontSize: "13px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontWeight: 700, color: "#334155", fontSize: "12.5px" }}>Super Admin Notice:</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>
              <Clock size={12} />
              {moduleConfig.updatedAt || "Active"}
            </span>
          </div>
          <p style={{ margin: 0, color: "#1e293b", lineHeight: 1.5, fontWeight: 500 }}>
            "{moduleConfig.message || "This section is currently undergoing maintenance by the platform engineering team."}"
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            to="/student"
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "11px 18px",
              background: "#ffffff",
              color: "#334155",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid #cbd5e1",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <ArrowLeft size={15} /> Return Home
          </Link>
          <a
            href="mailto:support@acadnexus.edu.in"
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "11px 18px",
              background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
              color: "#ffffff",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 3px 10px rgba(79, 70, 229, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Headphones size={15} /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
