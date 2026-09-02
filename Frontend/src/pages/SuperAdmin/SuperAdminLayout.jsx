import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/SuperAdmin/Sidebar';
import Header from '../../components/SuperAdmin/Header';

export default function SuperAdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Super Admin Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
