import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Database,
  Server,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { PlatformStats } from '../services/types';

export const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setLoading(true);
    api.getStats()
      .then(res => setStats(res))
      .catch(err => console.error("Failed to load stats", err))
      .finally(() => setLoading(false));
  };

  const statCards = [
    {
      title: 'Total Datasets',
      value: stats?.total_datasets ?? 0,
      sub: 'Saved in local engine',
      icon: Database,
      color: 'from-blue-500 to-indigo-600',
      to: '/datasets'
    },
    {
      title: 'Generated Records',
      value: (stats?.total_records ?? 0).toLocaleString(),
      sub: 'Synthetic data rows',
      icon: TrendingUp,
      color: 'from-indigo-500 to-violet-600',
      to: '/studio'
    },
    {
      title: 'Active Mock APIs',
      value: stats?.active_mock_apis ?? 0,
      sub: `${stats?.total_api_requests ?? 0} total requests`,
      icon: Server,
      color: 'from-cyan-500 to-blue-600',
      to: '/mockapi'
    },
    {
      title: 'Quality Score Avg',
      value: `${stats?.average_quality_score ?? 100}%`,
      sub: '15 validation checks',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      to: '/quality'
    },
  ];

  const quickStarts = [
    { title: 'Generate Dataset', desc: 'Create realistic data via Great Generator', icon: Sparkles, to: '/studio', bg: 'hover:border-indigo-500/50' },
    { title: 'Design Schema', desc: 'Configure column types and boundaries', icon: Database, to: '/schema-builder', bg: 'hover:border-violet-500/50' },
    { title: 'Deploy Mock REST API', desc: 'Turn dataset into interactive API', icon: Server, to: '/mockapi', bg: 'hover:border-cyan-500/50' },
    { title: 'Test Data Quality', desc: 'Run automated integrity & outlier checks', icon: ShieldCheck, to: '/quality', bg: 'hover:border-emerald-500/50' },
    { title: 'Explore 15 Templates', desc: 'Pre-built healthcare, banking & ecommerce', icon: Layers, to: '/templates', bg: 'hover:border-amber-500/50' },
    { title: 'AI Copilot Assistant', desc: 'Prompt-to-schema with Gemma rules', icon: Sparkles, to: '/ai-copilot', bg: 'hover:border-pink-500/50' },
  ];

  const pieData = stats?.format_distribution
    ? Object.entries(stats.format_distribution).map(([name, value]) => ({ name: name.toUpperCase(), value }))
    : [{ name: 'PARQUET', value: 1 }];

  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Great Generator Engine Active
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Synthetic Data & Mock API Platform
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Generate enterprise-grade synthetic datasets, launch instant mock REST APIs with stateful mutations, validate against 15+ data quality rules, and simulate fault injections.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link
              to="/studio"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Data Studio</span>
            </Link>
            <Link
              to="/templates"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Browse 15 Templates</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              to={c.to}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all hover:translate-y-[-2px] group block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{c.title}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                {loading ? '...' : c.value}
              </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                <span>{c.sub}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Generation Output</h3>
              <p className="text-xs text-slate-400">Rows produced per recent synthetic batch</p>
            </div>
            <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300">View History</Link>
          </div>
          <div className="h-56 w-full">
            {stats?.recent_jobs && stats.recent_jobs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recent_jobs}>
                  <XAxis dataKey="schema_name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="rows" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-600" />
                <span>No generation jobs yet. Start by generating your first dataset!</span>
              </div>
            )}
          </div>
        </div>

        {/* Format Distribution Pie */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Storage & Formats</h3>
            <p className="text-xs text-slate-400">Engine file format distribution</p>
          </div>
          <div className="h-44 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 text-xs text-slate-400">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start Actions */}
      <div>
        <h2 className="text-base font-bold text-white mb-4">Quick Start Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickStarts.map((q, i) => {
            const Icon = q.icon;
            return (
              <Link
                key={i}
                to={q.to}
                className={`p-4 rounded-xl bg-slate-900/60 border border-slate-800 transition-all flex items-start space-x-3 group ${q.bg}`}
              >
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center justify-between">
                    <span>{q.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{q.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Generation Jobs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Latest Generation Jobs</h3>
            <p className="text-xs text-slate-400">Audit trail of synthetic data runs</p>
          </div>
          <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View All History</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Dataset / Schema</th>
                <th className="p-3">Status</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {stats?.recent_jobs && stats.recent_jobs.length > 0 ? (
                stats.recent_jobs.map((job, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-medium text-slate-200">{job.schema_name}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </td>
                    <td className="p-3 font-mono">{job.rows}</td>
                    <td className="p-3 font-mono">{job.duration}s</td>
                    <td className="p-3 text-slate-400">{new Date(job.created_at).toLocaleTimeString()}</td>
                    <td className="p-3 text-right">
                      <Link
                        to="/datasets"
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No generation jobs recorded yet. Use Data Studio to generate your first dataset.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
