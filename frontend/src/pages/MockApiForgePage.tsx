import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Server,
  Plus,
  Trash2,
  RotateCcw,
  ExternalLink,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  Database,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MockApiItem, DatasetItem } from '../services/types';

export const MockApiForgePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mockApis, setMockApis] = useState<MockApiItem[]>([]);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);

  // Wizard Form State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [resourceName, setResourceName] = useState<string>('');
  const [primaryKey, setPrimaryKey] = useState<string>('id');
  const [defaultLimit, setDefaultLimit] = useState<number>(20);
  const [maxLimit, setMaxLimit] = useState<number>(100);
  const [allowedMethods, setAllowedMethods] = useState<string[]>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

  const [creating, setCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [docsModalApi, setDocsModalApi] = useState<MockApiItem | null>(null);

  useEffect(() => {
    loadMockApis();
    loadDatasets();
  }, []);

  // Pre-select if redirected from Data Studio
  useEffect(() => {
    if (location.state && (location.state as any).datasetId) {
      const id = (location.state as any).datasetId;
      setSelectedDatasetId(id);
    }
  }, [location.state, datasets]);

  useEffect(() => {
    if (selectedDatasetId && datasets.length > 0) {
      const match = datasets.find(d => d.id === selectedDatasetId);
      if (match) {
        const cleanName = match.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
        setResourceName(cleanName);
        if (match.columns_meta && match.columns_meta.length > 0) {
          const pkCandidate = match.columns_meta.find(c => c.name.toLowerCase().includes('id'));
          setPrimaryKey(pkCandidate ? pkCandidate.name : match.columns_meta[0].name);
        }
      }
    }
  }, [selectedDatasetId, datasets]);

  const loadMockApis = () => {
    api.listMockApis()
      .then(res => setMockApis(res))
      .catch(err => console.error(err));
  };

  const loadDatasets = () => {
    api.listDatasets()
      .then(res => {
        setDatasets(res);
        if (res.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(res[0].id);
        }
      })
      .catch(err => console.error(err));
  };

  const handleCreateMockApi = async () => {
    if (!selectedDatasetId || !resourceName.trim()) {
      setStatusMsg({ type: 'error', text: 'Dataset and Resource Name are required.' });
      return;
    }
    setCreating(true);
    setStatusMsg(null);
    try {
      const created = await api.createMockApi({
        dataset_id: selectedDatasetId,
        resource_name: resourceName.trim(),
        primary_key: primaryKey,
        default_limit: Number(defaultLimit),
        max_limit: Number(maxLimit),
        allowed_methods: allowedMethods
      });
      setStatusMsg({ type: 'success', text: `Mock REST API '/api/mock/${created.resource_name}' launched successfully!` });
      loadMockApis();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to create Mock API.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMockApi = async (id: string, name: string) => {
    if (!window.confirm(`Delete Mock API '/api/mock/${name}'?`)) return;
    try {
      await api.deleteMockApi(id);
      loadMockApis();
      setStatusMsg({ type: 'success', text: `Mock API '${name}' deleted.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete.' });
    }
  };

  const handleResetMockApi = async (id: string, name: string) => {
    try {
      const res = await api.resetMockApi(id);
      setStatusMsg({ type: 'success', text: `Mock API '${name}' reset back to original ${res.record_count} records.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Reset failed.' });
    }
  };

  const toggleMethod = (m: string) => {
    if (allowedMethods.includes(m)) {
      setAllowedMethods(allowedMethods.filter(x => x !== m));
    } else {
      setAllowedMethods([...allowedMethods, m]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Server className="w-6 h-6 text-indigo-400" />
          <span>MockAPI Forge</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Turn any generated dataset into stateful mock REST endpoints with full CRUD, filtering, pagination, and instant reset.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Creation Wizard Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Create New Mock REST API</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            Stateful & Mutable
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Source Dataset</label>
            <select
              value={selectedDatasetId}
              onChange={e => setSelectedDatasetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count} rows)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Resource Endpoint Name</label>
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 overflow-hidden px-3 py-1.5 focus-within:border-indigo-500">
              <span className="text-xs text-slate-500 font-mono">/api/mock/</span>
              <input
                type="text"
                value={resourceName}
                onChange={e => setResourceName(e.target.value)}
                placeholder="customers"
                className="w-full bg-transparent border-none text-slate-100 text-xs font-mono focus:outline-none ml-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Key Field</label>
            <input
              type="text"
              value={primaryKey}
              onChange={e => setPrimaryKey(e.target.value)}
              placeholder="id or customer_id"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Enabled Methods */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-2">Enabled HTTP Verbs</label>
          <div className="flex items-center gap-2 flex-wrap">
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMethod(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  allowedMethods.includes(m)
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleCreateMockApi}
            disabled={creating}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-60"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{creating ? 'Deploying...' : 'Deploy Mock API'}</span>
          </button>
        </div>
      </div>

      {/* Active Mock APIs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Active Mock REST APIs</h2>
            <p className="text-xs text-slate-400">Deployed endpoints accessible to local frontends and scripts</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {mockApis.length} Active Endpoints
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Resource & Route</th>
                <th className="p-3">Primary Key</th>
                <th className="p-3">Methods</th>
                <th className="p-3">Requests</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {mockApis.length > 0 ? (
                mockApis.map(apiItem => (
                  <tr key={apiItem.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400">{apiItem.base_endpoint}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{apiItem.primary_key}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {apiItem.allowed_methods.map(m => (
                          <span
                            key={m}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              m === 'GET'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : m === 'POST'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : m === 'DELETE'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono">{apiItem.total_requests}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Live
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Test in API Explorer */}
                        <button
                          onClick={() => navigate('/api-explorer', { state: { resource: apiItem.resource_name } })}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors text-[11px]"
                          title="Open in Interactive API Explorer"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Test</span>
                        </button>

                        {/* Reset mock state */}
                        <button
                          onClick={() => handleResetMockApi(apiItem.id, apiItem.resource_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Reset data back to original state"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Docs modal */}
                        <button
                          onClick={() => setDocsModalApi(apiItem)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Docs & Examples"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteMockApi(apiItem.id, apiItem.resource_name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Mock API"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No active mock APIs yet. Select a dataset above and click "Deploy Mock API".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docs Modal */}
      {docsModalApi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  Documentation: /api/mock/{docsModalApi.resource_name}
                </h3>
                <p className="text-xs text-slate-400">Live endpoint specification and integration code</p>
              </div>
              <button
                onClick={() => setDocsModalApi(null)}
                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {docsModalApi.endpoints_docs?.endpoints?.map((ep: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        ep.method === 'GET'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : ep.method === 'POST'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : ep.method === 'DELETE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono text-slate-200">{ep.path}</span>
                  </div>
                  <p className="text-xs text-slate-400">{ep.description}</p>

                  {ep.curl_example && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">cURL Example:</div>
                      <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 overflow-x-auto">
                        {ep.curl_example}
                      </pre>
                    </div>
                  )}

                  {ep.fetch_example && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">JavaScript Fetch:</div>
                      <pre className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
                        {ep.fetch_example}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
