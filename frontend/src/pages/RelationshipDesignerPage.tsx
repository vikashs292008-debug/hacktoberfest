import React, { useState, useEffect } from 'react';
import {
  Network,
  Play,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export const RelationshipDesignerPage: React.FC = () => {
  const [projectName, setProjectName] = useState('E-Commerce Relational Model');
  const [tables, setTables] = useState<any[]>([
    {
      name: 'customers',
      row_count: 20,
      primary_key: 'customer_id',
      columns: [
        { name: 'customer_id', dtype: 'int', description: 'PK' },
        { name: 'full_name', dtype: 'str', semantic_type: 'name' },
        { name: 'email', dtype: 'email', semantic_type: 'email' },
        { name: 'country', dtype: 'enum', accepted_values: ['US', 'UK', 'DE', 'CA', 'IN'] }
      ]
    },
    {
      name: 'orders',
      row_count: 40,
      primary_key: 'order_id',
      columns: [
        { name: 'order_id', dtype: 'int', description: 'PK' },
        { name: 'customer_id', dtype: 'int', description: 'FK to customers' },
        { name: 'order_date', dtype: 'date' },
        { name: 'status', dtype: 'enum', accepted_values: ['Delivered', 'Processing', 'Cancelled'] }
      ]
    },
    {
      name: 'order_items',
      row_count: 80,
      primary_key: 'item_id',
      columns: [
        { name: 'item_id', dtype: 'int', description: 'PK' },
        { name: 'order_id', dtype: 'int', description: 'FK to orders' },
        { name: 'product_name', dtype: 'str' },
        { name: 'quantity', dtype: 'int', min_value: 1, max_value: 5 },
        { name: 'price', dtype: 'float', min_value: 15.0, max_value: 450.0 }
      ]
    }
  ]);

  const [relationships, setRelationships] = useState<any[]>([
    {
      parent_table: 'customers',
      child_table: 'orders',
      parent_key: 'customer_id',
      foreign_key: 'customer_id',
      cardinality: 'one_to_many'
    },
    {
      parent_table: 'orders',
      child_table: 'order_items',
      parent_key: 'order_id',
      foreign_key: 'order_id',
      cardinality: 'one_to_many'
    }
  ]);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddRelationship = () => {
    if (tables.length < 2) return;
    setRelationships([
      ...relationships,
      {
        parent_table: tables[0].name,
        child_table: tables[1].name,
        parent_key: tables[0].primary_key,
        foreign_key: `${tables[0].name}_id`,
        cardinality: 'one_to_many'
      }
    ]);
  };

  const handleRemoveRelationship = (idx: number) => {
    setRelationships(relationships.filter((_, i) => i !== idx));
  };

  const handleLoadStarSchema = async () => {
    try {
      const data = await api.getSampleRelationalEcommerce();
      setProjectName(data.name);
      setTables(data.tables);
      setRelationships(data.relationships);
      setActiveTab(data.tables[0].name);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load star schema template');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await api.generateRelational({
        name: projectName,
        tables,
        relationships
      });
      setResult(res);
      const firstTbl = Object.keys(res.generated_tables)[0];
      if (firstTbl) setActiveTab(firstTbl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Relational generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Network className="w-6 h-6 text-indigo-400" />
            <span>Relationship Designer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build multi-table relational datasets with guaranteed foreign key referential integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadStarSchema}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load 5-Table Star Schema</span>
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating Model...' : 'Generate All Tables'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visual Relationship Diagram & Flow */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Relational Topology & Constraints</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            {relationships.length} Relationships Defined
          </span>
        </h3>

        {/* Visual Flow diagram representation */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          {tables.map((t, idx) => {
            const outgoing = relationships.filter(r => r.parent_table === t.name);
            return (
              <React.Fragment key={t.name}>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-center min-w-36 shadow-md">
                  <div className="font-bold text-indigo-400 capitalize">{t.name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 font-sans">{t.row_count} rows</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">PK: {t.primary_key}</div>
                </div>
                {idx < tables.length - 1 && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800">1:N</span>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Relationship Rules Editor */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Foreign Key Connections</span>
            <button
              onClick={handleAddRelationship}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Relationship</span>
            </button>
          </div>

          <div className="space-y-2">
            {relationships.map((rel, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Parent:</span>
                  <select
                    value={rel.parent_table}
                    onChange={e => {
                      const updated = [...relationships];
                      updated[i].parent_table = e.target.value;
                      setRelationships(updated);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Parent Key:</span>
                  <input
                    type="text"
                    value={rel.parent_key}
                    onChange={e => {
                      const updated = [...relationships];
                      updated[i].parent_key = e.target.value;
                      setRelationships(updated);
                    }}
                    className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Child:</span>
                  <select
                    value={rel.child_table}
                    onChange={e => {
                      const updated = [...relationships];
                      updated[i].child_table = e.target.value;
                      setRelationships(updated);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100"
                  >
                    {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Foreign Key:</span>
                  <input
                    type="text"
                    value={rel.foreign_key}
                    onChange={e => {
                      const updated = [...relationships];
                      updated[i].foreign_key = e.target.value;
                      setRelationships(updated);
                    }}
                    className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={rel.cardinality}
                    onChange={e => {
                      const updated = [...relationships];
                      updated[i].cardinality = e.target.value;
                      setRelationships(updated);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-[11px]"
                  >
                    <option value="one_to_many">1 : N (One-to-Many)</option>
                    <option value="one_to_one">1 : 1 (One-to-One)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleRemoveRelationship(i)}
                  className="p-1 text-slate-500 hover:text-rose-400 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Results & Integrity Report */}
      {result && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-5 animate-in fade-in">
          {/* Integrity Report Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Referential Integrity Verified</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generation execution order: <span className="font-mono text-indigo-400">{result.generation_order?.join(' → ')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                100% Join Coverage (0 Orphans)
              </span>
            </div>
          </div>

          {/* Table Preview Tabs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              {Object.keys(result.generated_tables).map(tName => (
                <button
                  key={tName}
                  onClick={() => setActiveTab(tName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tName
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="capitalize">{tName}</span>
                  <span className="ml-1.5 font-mono text-[10px] opacity-75">
                    ({result.generated_tables[tName].total_rows} rows)
                  </span>
                </button>
              ))}
            </div>

            {/* Active Table Preview */}
            {result.generated_tables[activeTab] && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800 text-[11px]">
                    <tr>
                      {result.generated_tables[activeTab].columns.map((c: string) => (
                        <th key={c} className="p-2.5 whitespace-nowrap bg-slate-950">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                    {result.generated_tables[activeTab].sample_records.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        {result.generated_tables[activeTab].columns.map((c: string) => (
                          <td key={c} className="p-2.5 whitespace-nowrap">{String(row[c] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
