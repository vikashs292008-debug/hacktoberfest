import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Search,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { GenerationJob } from '../services/types';

export const GenerationHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = () => {
    setLoading(true);
    api.listGenerations()
      .then(res => setJobs(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredJobs = jobs.filter(j =>
    j.schema_name.toLowerCase().includes(search.toLowerCase()) ||
    j.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-400" />
          <span>Generation History & Reproducibility</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete audit trail of synthetic data runs with row counts, random seeds, durations, and reproducibility settings.
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs by name or ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {jobs.length} total execution records
        </span>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Schema / Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Generated</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Seed</th>
                <th className="p-3">Execution Time</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{job.id.slice(0, 8)}...</td>
                    <td className="p-3 font-semibold text-slate-200">{job.schema_name}</td>
                    <td className="p-3">
                      {job.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{job.requested_rows}</td>
                    <td className="p-3 font-mono font-bold text-white">{job.actual_rows}</td>
                    <td className="p-3 font-mono text-slate-400">{job.duration_seconds}s</td>
                    <td className="p-3 font-mono text-slate-400">{job.seed ?? '—'}</td>
                    <td className="p-3 text-slate-400">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {job.dataset_id && (
                        <button
                          onClick={() => navigate('/datasets')}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          View Dataset
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No generation jobs recorded yet.
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
