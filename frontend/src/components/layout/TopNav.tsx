import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  Command,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [online, setOnline] = useState<boolean | null>(null);
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));

    const interval = setInterval(() => {
      api.getHealth()
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModal(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle = pathSegments.length === 0
    ? 'Overview Dashboard'
    : pathSegments[0].replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  const searchCommands = [
    { title: 'Data Studio', desc: 'Synthetic dataset generator with natural language parsing', path: '/studio' },
    { title: 'Schema Builder', desc: 'Create and modify column schemas & constraints', path: '/schema-builder' },
    { title: 'Relationship Designer', desc: 'Design multi-table star schemas with foreign keys', path: '/relationships' },
    { title: 'MockAPI Forge', desc: 'Deploy instant REST endpoints from synthetic datasets', path: '/mockapi' },
    { title: 'API Explorer', desc: 'Interactive HTTP client to test mock REST APIs', path: '/api-explorer' },
    { title: 'Data Quality Lab', desc: 'Run 15 validation checks and simulate fault injection', path: '/quality' },
    { title: 'AI Copilot', desc: 'Natural language dataset prompt & schema assistant', path: '/ai-copilot' },
    { title: 'Templates', desc: '15 ready-to-use domain schemas and datasets', path: '/templates' },
    { title: 'Dataset Explorer', desc: 'Browse, preview, export and manage saved datasets', path: '/datasets' },
    { title: 'Generation History', desc: 'Audit and re-execute synthetic generation jobs', path: '/history' },
    { title: 'Documentation', desc: 'Comprehensive API references and integration guides', path: '/docs' },
  ];

  const filteredCommands = searchCommands.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-slate-200 transition-colors">DataForge</Link>
          <span>/</span>
          <span className="text-slate-100 font-medium">{breadcrumbTitle}</span>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-4">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setSearchModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition-all w-52 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Quick search...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 text-slate-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Quick Generate Action */}
          <Link
            to="/studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Data</span>
          </Link>

          {/* Backend Health Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-900 border border-slate-800">
            {online === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                <span className="text-emerald-400 text-[11px]">API Online</span>
              </>
            ) : online === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 text-[11px]">API Offline</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-400 text-[11px]">Connecting...</span>
              </>
            )}
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            title="Open FastAPI Swagger Docs"
          >
            <span>Swagger</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Command Palette Modal */}
      {searchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type a command or page name..."
                className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder-slate-500"
              />
              <button
                onClick={() => setSearchModal(false)}
                className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                Esc
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchModal(false);
                      navigate(c.path);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400">{c.title}</div>
                      <div className="text-xs text-slate-400">{c.desc}</div>
                    </div>
                    <span className="text-xs text-slate-600 font-mono group-hover:text-slate-400">{c.path}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">No matching commands found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
