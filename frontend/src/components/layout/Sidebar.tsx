import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  Network,
  Server,
  Terminal,
  ShieldCheck,
  Bot,
  FolderOpen,
  Layers,
  History,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Data Studio', to: '/studio', icon: Sparkles, badge: 'Core' },
    { label: 'Schema Builder', to: '/schema-builder', icon: Database },
    { label: 'Relationship Designer', to: '/relationships', icon: Network },
    { label: 'MockAPI Forge', to: '/mockapi', icon: Server, badge: 'REST' },
    { label: 'API Explorer', to: '/api-explorer', icon: Terminal },
    { label: 'Data Quality Lab', to: '/quality', icon: ShieldCheck },
    { label: 'AI Copilot', to: '/ai-copilot', icon: Bot, badge: 'Gemma' },
    { label: 'Dataset Explorer', to: '/datasets', icon: FolderOpen },
    { label: 'Templates', to: '/templates', icon: Layers, count: '15' },
    { label: 'Generation History', to: '/history', icon: History },
    { label: 'Reports', to: '/reports', icon: FileText },
    { label: 'Documentation', to: '/docs', icon: BookOpen },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out border-r border-slate-800 bg-[#090d16] flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DataForge <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 ml-1">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Synthetic Data Engine</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800">
                      {item.count}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Great Generator Engine Footnote */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!collapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">great-generator</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v0.1.8</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Engine: Great Generator v0.1.8">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
