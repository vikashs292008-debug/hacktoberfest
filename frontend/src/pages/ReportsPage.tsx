import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { ValidationReport } from '../services/types';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ValidationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    setLoading(true);
    api.listReports()
      .then(res => setReports(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filteredReports = reports.filter(r =>
    r.dataset_name.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-indigo-400" />
          <span>Data Quality Reports Archive</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical validation reports, transparent quality scores, defect logs, and downloadable compliance summaries.
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
            placeholder="Search reports by dataset..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {reports.length} quality audit reports
        </span>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Report ID</th>
                <th className="p-3">Target Dataset</th>
                <th className="p-3">Score</th>
                <th className="p-3">Status</th>
                <th className="p-3">Passed / Failed</th>
                <th className="p-3">Audit Date</th>
                <th className="p-3 text-right">Downloads & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredReports.length > 0 ? (
                filteredReports.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{rep.id.slice(0, 8)}...</td>
                    <td className="p-3 font-semibold text-slate-200">{rep.dataset_name}</td>
                    <td className="p-3">
                      <span className="font-bold text-white text-sm font-mono">{rep.quality_score}</span>
                      <span className="text-[10px] text-slate-500"> / 100</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : rep.status === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold">{rep.passed_checks}</span> /{' '}
                      <span className="text-rose-400 font-bold">{rep.failed_checks}</span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(rep.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/quality', { state: { datasetId: rep.dataset_id } })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300"
                          title="Open in Quality Lab"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={api.getReportExportUrl(rep.id, 'markdown')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1"
                          title="Download Markdown Report"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>MD</span>
                        </a>
                        <a
                          href={api.getReportExportUrl(rep.id, 'json')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1"
                          title="Download JSON Report"
                        >
                          <Download className="w-3 h-3 text-indigo-400" />
                          <span>JSON</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No validation reports archived yet. Run validation in Data Quality Lab to generate reports.
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
