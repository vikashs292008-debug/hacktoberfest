import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Database,
  Play,
  Download,
  Server,
  ShieldCheck,
  Plus,
  Trash2,
  FileCode,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  Copy,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { ColumnDefinition } from '../services/types';

export const DataStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Modes: "nl_prompt" | "schema" | "domain" | "ddl"
  const [mode, setMode] = useState<'nl_prompt' | 'schema' | 'domain' | 'ddl'>('nl_prompt');
  
  // NL Prompt
  const [nlPrompt, setNlPrompt] = useState(
    'Generate 100 fictional customers with customer IDs, names, ages, email addresses, signup dates, customer segments, and purchase totals.'
  );
  const [parsingNl, setParsingNl] = useState(false);

  // Configuration
  const [datasetName, setDatasetName] = useState('customers_dataset');
  const [rowCount, setRowCount] = useState<number>(100);
  const [seed, setSeed] = useState<number>(42);
  const [realism, setRealism] = useState<string>('realistic');

  // Domain mode
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('ecommerce');

  // DDL mode
  const [ddlText, setDdlText] = useState(
    'CREATE TABLE users (\n  user_id INT PRIMARY KEY,\n  full_name VARCHAR(255),\n  email VARCHAR(255),\n  age INT,\n  country VARCHAR(100)\n);'
  );

  // Schema columns
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: 'customer_id', dtype: 'int', description: 'Primary Key', nullable: false },
    { name: 'full_name', dtype: 'str', semantic_type: 'name', description: 'Customer Name', nullable: false },
    { name: 'email', dtype: 'email', semantic_type: 'email', description: 'Email Address', nullable: false },
    { name: 'age', dtype: 'int', min_value: 18, max_value: 80, description: 'Age in years' },
    { name: 'segment', dtype: 'enum', accepted_values: ['Consumer', 'Corporate', 'Enterprise'], description: 'Segment' },
    { name: 'signup_date', dtype: 'date', description: 'Registration Date' },
    { name: 'purchase_total', dtype: 'float', min_value: 10.0, max_value: 4500.0, description: 'Total Spend' }
  ]);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  useEffect(() => {
    api.listTemplates().then(setAvailableTemplates).catch(() => {});
  }, []);

  // Check if routed from template
  useEffect(() => {
    if (location.state && (location.state as any).template) {
      const t = (location.state as any).template;
      setMode('schema');
      setDatasetName(t.name.toLowerCase().replace(/\s+/g, '_'));
      setRowCount(t.default_rows || 100);
      setColumns(t.columns || []);
    }
  }, [location.state]);

  // Load available domains on mount
  useEffect(() => {
    api.getDomains()
      .then(res => {
        setDomains(res.domains);
        if (res.domains.length > 0 && !selectedDomain) {
          setSelectedDomain(res.domains[0].name);
        }
      })
      .catch(err => console.error("Could not fetch domains", err));
  }, []);

  const handleParseNlPrompt = async () => {
    if (!nlPrompt.trim()) return;
    setParsingNl(true);
    setErrorMsg(null);
    try {
      const res = await api.suggestSchemaFromPrompt(nlPrompt);
      setDatasetName(res.name);
      setColumns(res.columns);
      if (res.suggested_rows) setRowCount(res.suggested_rows);
      setMode('schema'); // transition to editable schema
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse natural language prompt');
    } finally {
      setParsingNl(false);
    }
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: `col_${columns.length + 1}`,
        dtype: 'str',
        description: 'New attribute',
        nullable: true
      }
    ]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleUpdateColumn = (index: number, field: keyof ColumnDefinition, value: any) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value };
    setColumns(updated);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        name: datasetName,
        rows: Number(rowCount),
        seed: Number(seed),
        realism,
        mode,
      };

      if (mode === 'nl_prompt') {
        payload.nl_prompt = nlPrompt;
      } else if (mode === 'schema') {
        payload.columns = columns;
      } else if (mode === 'domain') {
        payload.domain = selectedDomain;
      } else if (mode === 'ddl') {
        payload.ddl_text = ddlText;
      }

      const res = await api.generateDataset(payload);
      setGenerationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span>DataForge Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build synthetic datasets using Great Generator with realistic semantic models & multi-format export.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {availableTemplates.length > 0 && (
            <select
              onChange={(e) => {
                const t = availableTemplates.find(x => x.id === e.target.value);
                if (t) {
                  setMode('schema');
                  setDatasetName(t.name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  setRowCount(t.default_rows || 100);
                  setColumns(t.columns || []);
                }
              }}
              defaultValue=""
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>Load Template Preset...</option>
              {availableTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.columns.length} cols)</option>
              ))}
            </select>
          )}

          {/* Mode Selector Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMode('nl_prompt')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'nl_prompt' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Prompt
          </button>
          <button
            onClick={() => setMode('schema')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'schema' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visual Schema
          </button>
          <button
            onClick={() => setMode('domain')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'domain' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Domain Presets
          </button>
          <button
            onClick={() => setMode('ddl')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'ddl' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL DDL
          </button>
        </div>
      </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Input Panels */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        {mode === 'nl_prompt' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Natural Language Dataset Specification
              </label>
              <span className="text-[11px] text-slate-500 font-mono">Gemma & Rule Parser Supported</span>
            </div>
            <textarea
              rows={3}
              value={nlPrompt}
              onChange={e => setNlPrompt(e.target.value)}
              placeholder="e.g. Generate 5,000 fictional customers with customer IDs, names, ages, emails, signup dates, segments, and purchase totals..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleParseNlPrompt}
                disabled={parsingNl}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{parsingNl ? 'Parsing Intent...' : 'Convert to Visual Schema'}</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'domain' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300">Select Great Generator Domain Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {domains.map(d => (
                <button
                  key={d.name}
                  onClick={() => setSelectedDomain(d.name)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedDomain === d.name
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold capitalize">{d.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {d.tables?.length ? `${d.tables.length} tables` : 'Preset schema'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'ddl' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Paste SQL DDL Definition</label>
              <span className="text-[11px] text-slate-500 font-mono">ANSI SQL, Postgres, MySQL</span>
            </div>
            <textarea
              rows={6}
              value={ddlText}
              onChange={e => setDdlText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {mode === 'schema' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-300">
                Visual Schema Editor ({columns.length} columns)
              </div>
              <button
                onClick={handleAddColumn}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Column Name</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">Semantic / Constraints</th>
                    <th className="p-2.5">Nullable</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 bg-slate-950/40">
                  {columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={col.name}
                          onChange={e => handleUpdateColumn(idx, 'name', e.target.value)}
                          className="w-36 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        />
                      </td>
                      <td className="p-2.5">
                        <select
                          value={col.dtype}
                          onChange={e => handleUpdateColumn(idx, 'dtype', e.target.value)}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        >
                          <option value="str">String</option>
                          <option value="int">Integer</option>
                          <option value="float">Float</option>
                          <option value="bool">Boolean</option>
                          <option value="date">Date</option>
                          <option value="timestamp">Timestamp</option>
                          <option value="enum">Enum</option>
                          <option value="email">Email</option>
                          <option value="uuid">UUID</option>
                        </select>
                      </td>
                      <td className="p-2.5">
                        {col.dtype === 'enum' ? (
                          <input
                            type="text"
                            placeholder="Val1, Val2, Val3"
                            value={col.accepted_values?.join(', ') || ''}
                            onChange={e =>
                              handleUpdateColumn(
                                idx,
                                'accepted_values',
                                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              )
                            }
                            className="w-48 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                          />
                        ) : col.dtype === 'int' || col.dtype === 'float' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="Min"
                              value={col.min_value ?? ''}
                              onChange={e => handleUpdateColumn(idx, 'min_value', e.target.value ? Number(e.target.value) : null)}
                              className="w-20 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={col.max_value ?? ''}
                              onChange={e => handleUpdateColumn(idx, 'max_value', e.target.value ? Number(e.target.value) : null)}
                              className="w-20 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Auto-inferred semantic</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={col.nullable || false}
                          onChange={e => handleUpdateColumn(idx, 'nullable', e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={col.description || ''}
                          onChange={e => handleUpdateColumn(idx, 'description', e.target.value)}
                          placeholder="Column purpose..."
                          className="w-40 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleRemoveColumn(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Remove Column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Controls Row */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Dataset Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={e => setDatasetName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Row Count</label>
            <input
              type="number"
              min={1}
              max={100000}
              value={rowCount}
              onChange={e => setRowCount(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Random Seed</label>
            <input
              type="number"
              value={seed}
              onChange={e => setSeed(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Realism Profile</label>
            <select
              value={realism}
              onChange={e => setRealism(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="realistic">Realistic (Semantics & Rules)</option>
              <option value="baseline">Baseline (Speed)</option>
              <option value="extreme">Edge Cases & Extreme</option>
            </select>
          </div>
        </div>

        {/* Generate Button Action */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-60"
          >
            <Play className={`w-4 h-4 fill-current ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating Data...' : `Generate ${rowCount} Records`}</span>
          </button>
        </div>
      </div>

      {/* Generation Results View */}
      {generationResult && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="text-base font-bold text-white">Generated: {generationResult.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ID: {generationResult.dataset_id}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  {generationResult.row_count} rows
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  {generationResult.column_count} columns
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {generationResult.duration_seconds}s
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  {(generationResult.size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={api.getExportUrl(generationResult.dataset_id, 'csv')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </a>
              <a
                href={api.getExportUrl(generationResult.dataset_id, 'json')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>JSON</span>
              </a>
              <a
                href={api.getExportUrl(generationResult.dataset_id, 'parquet')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Parquet</span>
              </a>

              {/* Deploy Mock API Button */}
              <button
                onClick={() => navigate('/mockapi', { state: { datasetId: generationResult.dataset_id } })}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Create Mock API</span>
              </button>

              {/* Validate in Quality Lab */}
              <button
                onClick={() => navigate('/quality', { state: { datasetId: generationResult.dataset_id } })}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Run Quality Lab</span>
              </button>
            </div>
          </div>

          {/* Generated Records Preview Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">First 20 Sample Records</span>
              <span>Showing sample view</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    {generationResult.columns.map((c: string) => (
                      <th key={c} className="p-2.5 whitespace-nowrap bg-slate-950">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                  {generationResult.preview_records.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      {generationResult.columns.map((c: string) => (
                        <td key={c} className="p-2.5 whitespace-nowrap">{String(row[c] ?? 'NULL')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
