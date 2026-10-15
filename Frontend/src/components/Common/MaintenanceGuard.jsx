import React from "react";
import { Link } from "react-router-dom";
import { Wrench, ShieldAlert, Clock, Sparkles, ArrowLeft, Headphones, Info, HelpCircle } from "lucide-react";
import { useSystemMaintenance } from "../../context/SystemMaintenanceContext";
import logoImg from "../../assets/Logo.png";
import trainXImg from "../../assets/TrainX.png";
import "./MaintenanceGuard.css";

export default function MaintenanceGuard({ moduleKey, children }) {
  const { isModuleActive, getModuleConfig } = useSystemMaintenance();

  const active = isModuleActive(moduleKey);

  if (active) {
    return <>{children}</>;
  }

  const moduleConfig = getModuleConfig(moduleKey);

  // Retrieve user role from session/localStorage if available to offer smart return link
  let homeRoute = "/";
  try {
    const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      const role = String(user?.role || "").toLowerCase();
      if (role.includes("super")) homeRoute = "/super-admin";
      else if (role.includes("admin")) homeRoute = "/admin";
      else if (role.includes("mentor")) homeRoute = "/mentor";
      else if (role.includes("coord")) homeRoute = "/coordinator";
      else if (role.includes("student")) homeRoute = "/student";
    }
  } catch (e) {
    homeRoute = "/";
  }

  return (
    <div className="mg-wrapper">
      {/* Ambient background glow accents */}
      <div className="mg-ambient-orb-1" />
      <div className="mg-ambient-orb-2" />
      <div className="mg-ambient-orb-3" />

      {/* Main Glassmorphic Card */}
      <div className="mg-card">
        {/* Brand Header */}
        <div className="mg-brand-header">
          <img src={logoImg} alt="TrainX Logo" className="mg-brand-logo-img" />
          <div className="mg-brand-title">
            <span>Train</span>
            <img src={trainXImg} alt="X" className="mg-brand-x-img" />
          </div>
        </div>

        {/* Hero Animated Icon */}
        <div className="mg-icon-wrapper">
          <div className="mg-icon-box">
            <Wrench size={38} strokeWidth={2.2} />
          </div>
          <div className="mg-badge-shield">
            <ShieldAlert size={14} />
          </div>
        </div>

        {/* Live Status Pill */}
        <div>
          <div className="mg-status-tag">
            <span className="mg-live-dot" />
            <Sparkles size={13} color="#d97706" />
            <span>Scheduled Maintenance Mode</span>
          </div>
        </div>

        {/* Title & Scope */}
        <h1 className="mg-title">
          {moduleConfig.name || "Module Temporarily Offline"}
        </h1>

        <div className="mg-scope-row">
          <span>Target Scope:</span>
          <span className="mg-scope-strong">
            {moduleConfig.role || "All Platform Roles"}
          </span>
        </div>

        {/* Notice Card - only displayed if notice message is present */}
        {moduleConfig.message && (
          <div className="mg-notice-card">
            <div className="mg-notice-header">
              <span className="mg-notice-label">
                <Info size={14} color="#2563eb" />
                Notice
              </span>
              {moduleConfig.updatedAt && (
                <span className="mg-notice-time">
                  <Clock size={12} />
                  {moduleConfig.updatedAt}
                </span>
              )}
            </div>
            <p className="mg-notice-text">
              {moduleConfig.message}
            </p>
          </div>
        )}

        {/* Actions Row */}
        <div className="mg-actions-row">
          <Link to={homeRoute} className="mg-btn-home">
            <ArrowLeft size={16} />
            <span>Return Home</span>
          </Link>

          <a
            href="mailto:support@acadnexus.edu.in"
            className="mg-btn-support"
            title="Contact technical support"
          >
            <Headphones size={16} />
            <span>Support</span>
          </a>
        </div>

        {/* Footer Guarantee */}
        <div className="mg-footer-text">
          <HelpCircle size={13} />
          <span>Need immediate access? Please notify your institutional campus administrator.</span>
        </div>
      </div>
    </div>
  );
}
