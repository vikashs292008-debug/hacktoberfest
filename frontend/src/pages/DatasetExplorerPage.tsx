import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Download,
  Trash2,
  Server,
  ShieldCheck,
  Eye,
  FileCode,
  HardDrive,
  Database,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Table as TableIcon,
  Layers,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api';
import { DatasetItem, DatasetPreview } from '../services/types';

export const DatasetExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Preview Modal
  const [previewModalDataset, setPreviewModalDataset] = useState<DatasetItem | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreview | null>(null);
  const [modalTab, setModalTab] = useState<'table' | 'analytics'>('table');
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadDatasets();
  }, [search, sourceFilter]);

  const loadDatasets = () => {
    api.listDatasets(search, sourceFilter)
      .then(res => setDatasets(res))
      .catch(err => console.error(err));
  };

  const handleOpenPreview = async (d: DatasetItem) => {
    setPreviewModalDataset(d);
    setPage(0);
    setModalTab('table');
    try {
      const data = await api.previewDataset(d.id, 25, 0);
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!previewModalDataset) return;
    setPage(newPage);
    try {
      const data = await api.previewDataset(previewModalDataset.id, 25, newPage * 25);
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete dataset '${name}'? This will also remove associated mock APIs and quality reports.`)) {
      return;
    }
    try {
      await api.deleteDataset(id);
      loadDatasets();
    } catch (err) {
      alert('Failed to delete dataset');
    }
  };

  // Generate chart data for analytics tab
  const getAnalyticsChartData = () => {
    if (!previewData || !previewData.records || previewData.records.length === 0) return [];
    
    // Check if city or occupation or category exists
    const catCol = previewData.columns.find(c => ['city', 'occupation', 'category', 'status', 'segment', 'department'].includes(c.toLowerCase()));
    if (catCol) {
      const counts: Record<string, number> = {};
      previewData.records.forEach(r => {
        const val = String(r[catCol] || 'Other');
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 10);
    }

    // Default: first 10 rows numerical field
    const numCol = previewData.columns.find(c => ['monthly_salary', 'total_expenses', 'price', 'amount', 'age', 'salary'].includes(c.toLowerCase()));
    if (numCol) {
      return previewData.records.slice(0, 10).map((r, i) => ({
        name: String(r.full_name || r.name || `Row ${i+1}`),
        value: Number(r[numCol] || 0)
      }));
    }

    return [];
  };

  const chartData = getAnalyticsChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-indigo-400" />
            <span>Dataset Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect, preview, and export synthetic datasets stored in local Parquet & SQLite.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/studio')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Quick Chips Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search datasets by name or ID..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Sources</option>
              <option value="generator">Generator Engine</option>
              <option value="template">Domain Template</option>
              <option value="fault_injection">Fault Injection</option>
              <option value="import">Imported File</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px]">Quick filters:</span>
          <button
            onClick={() => { setSearch(''); setSourceFilter(''); }}
            className={`px-2.5 py-1 rounded-lg border font-medium ${
              search === '' && sourceFilter === ''
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            All Datasets ({datasets.length})
          </button>
          <button
            onClick={() => setSearch('expenses')}
            className={`px-2.5 py-1 rounded-lg border font-medium ${
              search === 'expenses'
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            Personal Expenses
          </button>
          <button
            onClick={() => setSourceFilter('fault_injection')}
            className={`px-2.5 py-1 rounded-lg border font-medium ${
              sourceFilter === 'fault_injection'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            Corrupted Variants
          </button>
        </div>
      </div>

      {/* Datasets View */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Dataset Name</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Columns</th>
                  <th className="p-3">File Size</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {datasets.length > 0 ? (
                  datasets.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span>{d.name}</span>
                          {d.name.includes("Expenses") && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {d.id}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            d.is_fault_injected
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {d.source}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">{d.row_count.toLocaleString()}</td>
                      <td className="p-3 font-mono">{d.column_count}</td>
                      <td className="p-3 font-mono text-slate-400">{(d.size_bytes / 1024).toFixed(1)} KB</td>
                      <td className="p-3 text-slate-400">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(d)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Inspect & Analytics"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                          <a
                            href={api.getExportUrl(d.id, 'csv')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Download CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                          <a
                            href={api.getExportUrl(d.id, 'json')}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Download JSON"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                          </a>
                          <button
                            onClick={() => navigate('/mockapi', { state: { datasetId: d.id } })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Deploy Mock API"
                          >
                            <Server className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => navigate('/quality', { state: { datasetId: d.id } })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Run Quality Lab"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No datasets found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {datasets.map(d => (
            <div key={d.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-xs">{d.name}</h3>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {d.id}</div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    d.is_fault_injected
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  {d.source}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-500">Rows</div>
                  <div className="font-bold text-slate-200">{d.row_count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Cols</div>
                  <div className="font-bold text-slate-200">{d.column_count}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Size</div>
                  <div className="font-bold text-slate-200">{(d.size_bytes / 1024).toFixed(0)}KB</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenPreview(d)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
                <div className="flex items-center gap-2">
                  <a
                    href={api.getExportUrl(d.id, 'csv')}
                    className="p-1 text-slate-400 hover:text-emerald-400"
                    title="CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={api.getExportUrl(d.id, 'json')}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(d.id, d.name)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dataset Preview & Analytics Modal */}
      {previewModalDataset && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{previewModalDataset.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {previewData.total_rows} total records
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono text-[11px]">
                  Columns: {previewData.columns.join(', ')}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tab Switcher */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <button
                    onClick={() => setModalTab('table')}
                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                      modalTab === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Table View</span>
                  </button>
                  <button
                    onClick={() => setModalTab('analytics')}
                    className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                      modalTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Visual Analytics</span>
                  </button>
                </div>

                <a
                  href={api.getExportUrl(previewModalDataset.id, 'csv')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </a>
                <a
                  href={api.getExportUrl(previewModalDataset.id, 'json')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>JSON</span>
                </a>
                <button
                  onClick={() => {
                    setPreviewModalDataset(null);
                    navigate('/mockapi', { state: { datasetId: previewModalDataset.id } });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Deploy API</span>
                </button>
                <button
                  onClick={() => setPreviewModalDataset(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Body: Table or Analytics */}
            {modalTab === 'table' ? (
              <>
                <div className="flex-1 overflow-auto rounded-xl border border-slate-800 min-h-60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800 text-[11px]">
                      <tr>
                        {previewData.columns.map(c => (
                          <th key={c} className="p-2.5 whitespace-nowrap bg-slate-950">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                      {previewData.records.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          {previewData.columns.map(c => (
                            <td key={c} className="p-2.5 whitespace-nowrap">
                              {typeof row[c] === 'number' && row[c] > 999
                                ? row[c].toLocaleString()
                                : String(row[c] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Showing rows {page * 25 + 1} to {Math.min((page + 1) * 25, previewData.total_rows)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>Page {page + 1}</span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={(page + 1) * 25 >= previewData.total_rows}
                      className="px-2.5 py-1 rounded bg-slate-800 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Visual Analytics Tab */
              <div className="flex-1 overflow-auto space-y-4 p-2">
                {/* Column Stats Grid */}
                {previewData.column_stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(previewData.column_stats).slice(0, 8).map(([col, st]: any) => (
                      <div key={col} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="font-mono text-indigo-400 font-bold truncate">{col}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{st.dtype} • {st.unique_count} unique</div>
                        {st.mean !== undefined && (
                          <div className="mt-2 text-[11px] text-slate-300 font-mono">
                            Avg: <span className="font-bold text-white">{st.mean.toLocaleString()}</span>
                          </div>
                        )}
                        {st.min !== undefined && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Range: {st.min.toLocaleString()} - {st.max.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Visual Chart */}
                {chartData.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-200">
                      Sample Distribution Overview
                    </div>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
