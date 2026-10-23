import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Server,
  ShieldCheck,
  Sparkles,
  Database
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pythonSnippet = `from great_generator import generate_from_schema
from great_generator.schemas import TableSchema, ColumnSpec

# 1. Define synthetic schema
schema = TableSchema(
    name="customers",
    columns=(
        ColumnSpec(name="customer_id", dtype="int"),
        ColumnSpec(name="full_name", dtype="str", semantic_type="name"),
        ColumnSpec(name="email", dtype="str", semantic_type="email"),
        ColumnSpec(name="age", dtype="int", min_value=18, max_value=80),
        ColumnSpec(name="country", dtype="str", accepted_values=("US", "UK", "DE", "IN")),
    ),
    primary_key="customer_id"
)

# 2. Generate 100 realistic rows
df = generate_from_schema(schema, rows=100, seed=42)
print(df.head())
`;

  const curlSnippet = `# Query Mock REST API with pagination & filtering
curl -X GET "http://localhost:8000/api/mock/customers?limit=10&sort_by=customer_id&sort_dir=asc"

# Create a new record in Mock API
curl -X POST "http://localhost:8000/api/mock/customers" \\
  -H "Content-Type: application/json" \\
  -d '{"full_name": "Marcus Vance", "email": "m.vance@example.com", "age": 34}'

# Reset mock data back to original state
curl -X POST "http://localhost:8000/api/mock/customers/reset"
`;

  const fetchSnippet = `// 1. Fetch paginated records from MockAPI Forge
const response = await fetch('http://localhost:8000/api/mock/customers?limit=10');
const { total, data } = await response.json();
console.log(\`Retrieved \${data.length} of \${total} records:\`, data);

// 2. Perform a partial update via PATCH
const updateRes = await fetch('http://localhost:8000/api/mock/customers/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ segment: 'Enterprise' })
});
console.log('Updated Record:', await updateRes.json());
`;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <span>Platform Documentation & Developer Guide</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete reference for DataForge Studio, Great Generator integration, MockAPI Forge, and DataTest AI.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-indigo-400">FastAPI Swagger UI</div>
              <div className="text-[11px] text-slate-500 font-mono">http://localhost:8000/docs</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
        </a>

        <a
          href="http://localhost:8000/health"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400">System Health Endpoint</div>
              <div className="text-[11px] text-slate-500 font-mono">/health</div>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
        </a>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Engine Version</div>
            <div className="text-[11px] text-slate-500 font-mono">great-generator 0.1.8</div>
          </div>
        </div>
      </div>

      {/* Section 1: Architecture */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-white">1. Core Platform Architecture</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          DataForge AI bridges synthetic generation with frontend development environments. Instead of mocking static JSON arrays, DataForge AI produces realistic datasets through Great Generator, validates them with 15 quality checks, and serves them as persistent, stateful mock REST APIs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-indigo-400">DataForge Studio</div>
            <p className="text-slate-400 text-[11px] mt-1">Generates synthetic records from schemas, domains, or natural language prompts.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-cyan-400">MockAPI Forge</div>
            <p className="text-slate-400 text-[11px] mt-1">Deploys stateful REST endpoints (GET, POST, PUT, PATCH, DELETE) with live reset.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="font-bold text-emerald-400">DataTest AI</div>
            <p className="text-slate-400 text-[11px] mt-1">Runs 15 validation checks, calculates transparent scores, and injects fault variants.</p>
          </div>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">2. Developer Integration Code</h2>

        {/* Python */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Python (Direct Great Generator Engine)
            </span>
            <button
              onClick={() => copy('py', pythonSnippet)}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedKey === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'py' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950/40">
            {pythonSnippet}
          </pre>
        </div>

        {/* cURL */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              cURL (Mock REST API Execution)
            </span>
            <button
              onClick={() => copy('curl', curlSnippet)}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto bg-slate-950/40">
            {curlSnippet}
          </pre>
        </div>

        {/* JavaScript Fetch */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              JavaScript / TypeScript Fetch
            </span>
            <button
              onClick={() => copy('fetch', fetchSnippet)}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedKey === 'fetch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'fetch' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-indigo-300 overflow-x-auto bg-slate-950/40">
            {fetchSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
