import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Database,
  ArrowRight,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Cpu,
  Copy
} from 'lucide-react';
import { api } from '../services/api';

export const AiCopilotPage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePrompts = [
    'Generate 5,000 fictional customers with customer IDs, names, ages, emails, signup dates, segments, and purchase totals.',
    'Create an employee payroll dataset with departments, salaries between 50k and 180k, titles, and hire dates.',
    'Build an IoT sensor telemetry log with device IDs, temperatures in celsius, humidity percentages, and alert flags.',
    'Hospital clinic appointments with doctor names, departments, appointment dates, and duration in minutes.'
  ];

  const handleExecutePrompt = async (textToRun?: string) => {
    const text = textToRun || prompt;
    if (!text.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await api.suggestSchemaFromPrompt(text.trim());
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI Copilot failed to process prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInDataStudio = () => {
    if (!result) return;
    navigate('/studio', {
      state: {
        template: {
          name: result.name,
          default_rows: result.suggested_rows,
          columns: result.columns
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-indigo-400" />
          <span>AI Data Copilot</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Describe synthetic datasets in natural language. Powered by Gemma & rule-based deterministic parsers.
        </p>
      </div>

      {/* Main Prompt Assistant Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Natural Language Dataset Specification
          </label>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-[11px] font-mono text-cyan-400">Gemma Semantic Model Active</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Type your requirements, e.g. 'Generate 1,000 fictional healthcare patients with medical IDs, names, birth dates, blood types, admission status, and insurance providers'..."
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors pr-24"
          />
          <button
            onClick={() => handleExecutePrompt()}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Synthesizing...' : 'Synthesize'}</span>
          </button>
        </div>

        {/* Quick Sample Suggestions */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Sample Prompt Prompts:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {samplePrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(s);
                  handleExecutePrompt(s);
                }}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-left text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center justify-between group"
              >
                <span className="truncate pr-2">{s}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Suggested Schema Output Card */}
      {result && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white capitalize">{result.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PK: {result.primary_key}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{result.rationale}</p>
            </div>

            <button
              onClick={handleOpenInDataStudio}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open in Data Studio & Generate</span>
            </button>
          </div>

          {/* Columns Preview Table */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300">
              Inferred Column Specifications ({result.columns?.length || 0})
            </span>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Field Name</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">Constraints</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                  {result.columns.map((col: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-indigo-400 font-bold">{col.name}</td>
                      <td className="p-2.5 text-cyan-400 capitalize">{col.dtype}</td>
                      <td className="p-2.5 text-slate-400">
                        {col.accepted_values
                          ? `Enum: [${col.accepted_values.join(', ')}]`
                          : col.min_value !== undefined && col.min_value !== null
                          ? `Range: ${col.min_value} - ${col.max_value}`
                          : col.semantic_type
                          ? `Semantic: ${col.semantic_type}`
                          : 'Standard'}
                      </td>
                      <td className="p-2.5 text-slate-400 font-sans text-xs">{col.description || '—'}</td>
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
