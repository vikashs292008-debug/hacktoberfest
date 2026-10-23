import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Flame,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { ValidationReport, DatasetItem } from '../services/types';

export const DataQualityLabPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  const [validating, setValidating] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fault Injection Simulator State
  const [targetPercentage, setTargetPercentage] = useState<number>(15);
  const [corruptMissing, setCorruptMissing] = useState(true);
  const [corruptDuplicates, setCorruptDuplicates] = useState(true);
  const [corruptEmails, setCorruptEmails] = useState(true);
  const [corruptNumericOutliers, setCorruptNumericOutliers] = useState(true);
  const [corruptEnums, setCorruptEnums] = useState(true);

  const [injecting, setInjecting] = useState(false);
  const [faultResult, setFaultResult] = useState<any>(null);

  useEffect(() => {
    api.listDatasets().then(res => {
      setDatasets(res);
      if (location.state && (location.state as any).datasetId) {
        setSelectedDatasetId((location.state as any).datasetId);
      } else if (res.length > 0) {
        setSelectedDatasetId(res[0].id);
      }
    });
  }, [location.state]);

  useEffect(() => {
    if (selectedDatasetId) {
      loadReport(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadReport = async (id: string) => {
    setValidating(true);
    setErrorMsg(null);
    try {
      const rep = await api.getQualityReport(id);
      setReport(rep);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleRunValidation = async () => {
    if (!selectedDatasetId) return;
    setValidating(true);
    setErrorMsg(null);
    try {
      const rep = await api.validateDataset(selectedDatasetId);
      setReport(rep);
    } catch (err: any) {
      setErrorMsg(err.message || 'Validation execution failed');
    } finally {
      setValidating(false);
    }
  };

  const handleInjectFaults = async () => {
    if (!selectedDatasetId) return;
    setInjecting(true);
    setErrorMsg(null);
    try {
      const res = await api.injectFaults(selectedDatasetId, {
        target_percentage: targetPercentage,
        corrupt_missing: corruptMissing,
        corrupt_duplicates: corruptDuplicates,
        corrupt_emails: corruptEmails,
        corrupt_numeric_outliers: corruptNumericOutliers,
        corrupt_enums: corruptEnums
      });
      setFaultResult(res);
      // Refresh datasets list to show new corrupted variant
      api.listDatasets().then(setDatasets);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fault injection failed');
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>DataTest AI — Quality Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit datasets against 15 automated validation checks, compute transparent quality scores, and inject controlled test faults.
          </p>
        </div>

        {/* Dataset Selector Bar */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDatasetId}
            onChange={e => setSelectedDatasetId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-medium"
          >
            {datasets.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} {d.is_fault_injected ? '[Defected Variant]' : ''} ({d.row_count} rows)
              </option>
            ))}
          </select>

          <button
            onClick={handleRunValidation}
            disabled={validating}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${validating ? 'animate-spin' : ''}`} />
            <span>{validating ? 'Checking...' : 'Re-Run Checks'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Score Overview & Metrics */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Quality Score Hero Card */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Quality Score</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  report.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : report.status === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {report.status}
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {report.quality_score}
              </span>
              <span className="text-slate-500 text-sm">/ 100</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.quality_score >= 85
                    ? 'bg-emerald-400'
                    : report.quality_score >= 60
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${report.quality_score}%` }}
              ></div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-400">Total Checks Evaluated</span>
            <div className="text-3xl font-extrabold text-white my-2">{report.total_checks}</div>
            <span className="text-xs text-slate-500">15 validation dimensions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Passed Checks
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 my-2">{report.passed_checks}</div>
            <span className="text-xs text-slate-500">Zero defect rules</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-medium text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              Failed / Warnings
            </span>
            <div className="text-3xl font-extrabold text-rose-400 my-2">{report.failed_checks}</div>
            <span className="text-xs text-slate-500">Deductions applied</span>
          </div>
        </div>
      )}

      {/* Detailed Validation Checks Table */}
      {report && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Validation Rules Audit</h2>
              <p className="text-xs text-slate-400 font-mono text-[11px] mt-0.5">
                {report.scoring_formula}
              </p>
            </div>

            {/* Export Report Actions */}
            <div className="flex items-center gap-2">
              <a
                href={api.getReportExportUrl(report.id, 'markdown')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Markdown Report</span>
              </a>
              <a
                href={api.getReportExportUrl(report.id, 'json')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>JSON Report</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Check Rule</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Deduction</th>
                  <th className="p-3">Description & Affected Columns</th>
                  <th className="p-3">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {report.checks.map((check, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-medium text-slate-200">
                      {check.check_name}
                    </td>
                    <td className="p-3 capitalize text-slate-400 font-medium">
                      {check.category}
                    </td>
                    <td className="p-3">
                      {check.passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-rose-400">
                      {check.score_impact > 0 ? `-${check.score_impact} pts` : '0 pts'}
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs">
                      <div>{check.description}</div>
                      {check.affected_columns.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
                          Cols: {check.affected_columns.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] max-w-xs">
                      {check.suggested_fix || 'No action needed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fault Injection Simulator Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Fault Injection Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate real-world data corruption in a separate test variant while keeping the original dataset 100% untouched.
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono">
            Safety Guard Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Corruption Percentage Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Target Defect Percentage</span>
              <span className="font-mono text-rose-400 font-bold">{targetPercentage}% of rows</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={targetPercentage}
              onChange={e => setTargetPercentage(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <p className="text-[11px] text-slate-500">
              Affects roughly {Math.round(((datasets.find(d => d.id === selectedDatasetId)?.row_count || 100) * targetPercentage) / 100)} records.
            </p>
          </div>

          {/* Fault Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Injectable Anomaly Types:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={corruptMissing}
                  onChange={e => setCorruptMissing(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Missing/Null Values</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={corruptDuplicates}
                  onChange={e => setCorruptDuplicates(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Duplicate Records</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={corruptEmails}
                  onChange={e => setCorruptEmails(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Malformed Emails</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={corruptNumericOutliers}
                  onChange={e => setCorruptNumericOutliers(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Numeric Outliers</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={corruptEnums}
                  onChange={e => setCorruptEnums(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-rose-500"
                />
                <span>Invalid Categories</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleInjectFaults}
            disabled={injecting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-60"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{injecting ? 'Injecting Defects...' : `Generate Corrupted Variant (${targetPercentage}%)`}</span>
          </button>
        </div>

        {/* Fault Injection Result Comparison */}
        {faultResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 mt-4 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Corrupted Test Variant Created: {faultResult.corrupted_dataset_name}
              </span>
              <button
                onClick={() => {
                  setSelectedDatasetId(faultResult.corrupted_dataset_id);
                  loadReport(faultResult.corrupted_dataset_id);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Audit Defected Dataset</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Total records affected: <span className="font-mono text-rose-400">{faultResult.total_records_affected}</span></div>
              <div className="space-y-0.5">
                {faultResult.injected_transformations?.map((t: any, idx: number) => (
                  <div key={idx} className="font-mono text-[11px] text-slate-400">
                    • {t.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
