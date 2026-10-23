import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  CheckCircle2,
  Tag,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { TemplateItem } from '../services/types';

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

  useEffect(() => {
    api.listTemplates()
      .then(res => setTemplates(res))
      .catch(err => console.error(err));
  }, []);

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.intended_use.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleUseTemplate = (t: TemplateItem) => {
    navigate('/studio', { state: { template: t } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-400" />
          <span>Synthetic Domain Templates</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          15 pre-built production-grade schemas ready for instant synthesis across commerce, healthcare, IoT, finance, and SaaS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates by keyword..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              !selectedCategory ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid (15 items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(t => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group space-y-4 shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {t.name}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 inline-block mt-1">
                    {t.category}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {t.columns.length} cols
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                {t.description}
              </p>

              <div className="mt-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px] block">Intended Use:</span>
                <span className="text-slate-300">{t.intended_use}</span>
              </div>

              {/* Column Badges */}
              <div className="flex flex-wrap gap-1 mt-3">
                {t.columns.slice(0, 5).map(c => (
                  <span key={c.name} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                    {c.name}
                  </span>
                ))}
                {t.columns.length > 5 && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-slate-500 text-[10px] font-mono">
                    +{t.columns.length - 5} more
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPreviewTemplate(t)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Schema</span>
              </button>

              <button
                onClick={() => handleUseTemplate(t)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all group-hover:bg-indigo-600 group-hover:text-white"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schema Detail Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Template: {previewTemplate.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                    Default {previewTemplate.default_rows} rows
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Field</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                  {previewTemplate.columns.map(col => (
                    <tr key={col.name} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-indigo-400 font-bold">{col.name}</td>
                      <td className="p-2.5 text-cyan-400">{col.dtype}</td>
                      <td className="p-2.5 text-slate-400 font-sans text-xs">{col.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setPreviewTemplate(null);
                  handleUseTemplate(previewTemplate);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open in Data Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
