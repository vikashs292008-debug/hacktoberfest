import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  Play,
  FileCode,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { ColumnDefinition, SchemaItem } from '../services/types';

export const SchemaBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedSchemas, setSavedSchemas] = useState<SchemaItem[]>([]);
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);

  const [schemaName, setSchemaName] = useState('user_profile_schema');
  const [schemaDesc, setSchemaDesc] = useState('Standard customer user profile with contact details');
  const [primaryKey, setPrimaryKey] = useState('user_id');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: 'user_id', dtype: 'int', description: 'Primary ID', nullable: false },
    { name: 'full_name', dtype: 'str', semantic_type: 'name', description: 'Full legal name', nullable: false },
    { name: 'email', dtype: 'email', semantic_type: 'email', description: 'Contact email', nullable: false },
    { name: 'age', dtype: 'int', min_value: 18, max_value: 90, description: 'Age in years' },
    { name: 'status', dtype: 'enum', accepted_values: ['Active', 'Pending', 'Suspended'], description: 'Account status' },
    { name: 'is_verified', dtype: 'bool', description: 'Verification flag' }
  ]);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = () => {
    api.listSchemas()
      .then(res => setSavedSchemas(res))
      .catch(err => console.error(err));
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: `field_${columns.length + 1}`,
        dtype: 'str',
        description: '',
        nullable: true
      }
    ]);
  };

  const handleRemoveColumn = (idx: number) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const handleUpdateColumn = (idx: number, field: keyof ColumnDefinition, val: any) => {
    const updated = [...columns];
    updated[idx] = { ...updated[idx], [field]: val };
    setColumns(updated);
  };

  const handleSaveSchema = async () => {
    if (!schemaName.trim()) {
      setStatusMsg({ type: 'error', text: 'Schema name is required.' });
      return;
    }
    setSaving(true);
    setStatusMsg(null);
    try {
      if (activeSchemaId) {
        await api.updateSchema(activeSchemaId, {
          name: schemaName,
          description: schemaDesc,
          primary_key: primaryKey,
          columns
        });
        setStatusMsg({ type: 'success', text: `Schema '${schemaName}' updated successfully.` });
      } else {
        const created = await api.createSchema({
          name: schemaName,
          description: schemaDesc,
          primary_key: primaryKey,
          columns
        });
        setActiveSchemaId(created.id);
        setStatusMsg({ type: 'success', text: `Schema '${schemaName}' saved to database.` });
      }
      loadSchemas();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save schema.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSchema = (s: SchemaItem) => {
    setActiveSchemaId(s.id);
    setSchemaName(s.name);
    setSchemaDesc(s.description || '');
    setPrimaryKey(s.primary_key || 'id');
    setColumns(s.columns || []);
    setStatusMsg({ type: 'success', text: `Loaded schema '${s.name}'.` });
  };

  const handleDeleteSchema = async (id: string, name: string) => {
    if (!window.confirm(`Delete schema '${name}'?`)) return;
    try {
      await api.deleteSchema(id);
      if (activeSchemaId === id) {
        setActiveSchemaId(null);
      }
      loadSchemas();
      setStatusMsg({ type: 'success', text: `Schema '${name}' deleted.` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete schema.' });
    }
  };

  const handleExportJson = () => {
    const payload = {
      name: schemaName,
      description: schemaDesc,
      primary_key: primaryKey,
      columns
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaName}_schema.json`;
    a.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.name) setSchemaName(parsed.name);
        if (parsed.description) setSchemaDesc(parsed.description);
        if (parsed.primary_key) setPrimaryKey(parsed.primary_key);
        if (Array.isArray(parsed.columns)) setColumns(parsed.columns);
        setActiveSchemaId(null);
        setStatusMsg({ type: 'success', text: 'Schema JSON imported successfully!' });
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'Invalid schema JSON file format.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-indigo-400" />
            <span>Schema Builder</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Design reusable schemas with strict data types, semantic tags, enums, and numerical ranges.
          </p>
        </div>

        {/* Global Schema Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleSaveSchema}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : activeSchemaId ? 'Update Schema' : 'Save Schema'}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
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

      {/* Grid: Editor + Saved Schemas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Schema Editor */}
        <div className="lg:col-span-3 space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Schema Name</label>
              <input
                type="text"
                value={schemaName}
                onChange={e => setSchemaName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Primary Key Column</label>
              <input
                type="text"
                value={primaryKey}
                onChange={e => setPrimaryKey(e.target.value)}
                placeholder="e.g. id, user_id"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Description</label>
              <input
                type="text"
                value={schemaDesc}
                onChange={e => setSchemaDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Columns Editor Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Defined Columns ({columns.length})
              </span>
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
                    <th className="p-2.5">Field Name</th>
                    <th className="p-2.5">Data Type</th>
                    <th className="p-2.5">Constraints / Values</th>
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
                          className="w-32 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono"
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
                            placeholder="Option1, Option2, Option3"
                            value={col.accepted_values?.join(', ') || ''}
                            onChange={e =>
                              handleUpdateColumn(
                                idx,
                                'accepted_values',
                                e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              )
                            }
                            className="w-44 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100"
                          />
                        ) : col.dtype === 'int' || col.dtype === 'float' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="Min"
                              value={col.min_value ?? ''}
                              onChange={e => handleUpdateColumn(idx, 'min_value', e.target.value ? Number(e.target.value) : null)}
                              className="w-16 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                            />
                            <span className="text-slate-500">-</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={col.max_value ?? ''}
                              onChange={e => handleUpdateColumn(idx, 'max_value', e.target.value ? Number(e.target.value) : null)}
                              className="w-16 px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Standard formatting</span>
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
                          placeholder="Doc description..."
                          className="w-36 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleRemoveColumn(idx)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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
        </div>

        {/* Saved Schemas Sidebar Panel */}
        <div className="space-y-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Saved Schemas</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {savedSchemas.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {savedSchemas.length > 0 ? (
              savedSchemas.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleLoadSchema(s)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    activeSchemaId === s.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{s.name}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteSchema(s.id, s.name);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{s.columns?.length || 0} fields</span>
                    <span className="font-mono text-[10px]">PK: {s.primary_key}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No saved schemas yet. Create and click "Save Schema" above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
