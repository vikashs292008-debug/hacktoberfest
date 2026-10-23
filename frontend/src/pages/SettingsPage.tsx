import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Shield,
  Save,
  CheckCircle2,
  Server,
  Database
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [maxPreview, setMaxPreview] = useState(200);
  const [maxGeneration, setMaxGeneration] = useState(100000);
  const [aiProvider, setAiProvider] = useState('gemini_rule_fallback');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Platform Settings & Storage Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage local synthetic data generation limits, storage directories, and AI runtime settings.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Generation Limits */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Synthetic Generation Limits</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Max Rows Per Preview
            </label>
            <input
              type="number"
              value={maxPreview}
              onChange={e => setMaxPreview(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Default: 200 rows</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Max Rows Per Single Batch Job
            </label>
            <input
              type="number"
              value={maxGeneration}
              onChange={e => setMaxGeneration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Default: 100,000 rows</span>
          </div>
        </div>
      </div>

      {/* Storage and Directories */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Persistent Storage Layout</span>
        </h2>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">SQLite Database Path:</span>
            <span className="text-indigo-400 font-semibold">data/dataforge.db</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Parquet Datasets Directory:</span>
            <span className="text-emerald-400 font-semibold">data/datasets/</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Mock API States Directory:</span>
            <span className="text-cyan-400 font-semibold">data/mock_state/</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Quality Reports Directory:</span>
            <span className="text-amber-400 font-semibold">data/reports/</span>
          </div>
        </div>
      </div>

      {/* AI Model Runtime */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>AI Copilot & Natural Language Engine</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              Selected AI Backend Provider
            </label>
            <select
              value={aiProvider}
              onChange={e => setAiProvider(e.target.value)}
              className="w-full md:w-80 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="gemini_rule_fallback">Gemma / Gemini (Smart Rule-Based Fallback Active)</option>
              <option value="gemma_local">Gemma Local Runtime (Ollama / HuggingFace)</option>
              <option value="gemini_api">Google Gemini Developer API</option>
            </select>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            DataForge AI executes deterministic semantic parsing and template mapping by default, guaranteeing zero downtime even when no external AI keys are configured.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
