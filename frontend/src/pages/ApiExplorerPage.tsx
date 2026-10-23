import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  FileJson,
  Layers,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { MockApiItem } from '../services/types';

export const ApiExplorerPage: React.FC = () => {
  const location = useLocation();
  const [mockApis, setMockApis] = useState<MockApiItem[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('customers');

  // Request state
  const [method, setMethod] = useState<string>('GET');
  const [pathSuffix, setPathSuffix] = useState<string>('?limit=10');
  const [requestBody, setRequestBody] = useState<string>(
    '{\n  "full_name": "Alice Montgomery",\n  "email": "alice.montgomery@example.com",\n  "age": 28,\n  "segment": "Consumer"\n}'
  );

  // Execution state
  const [loading, setLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    api.listMockApis()
      .then(res => {
        setMockApis(res);
        if (location.state && (location.state as any).resource) {
          setSelectedResource((location.state as any).resource);
        } else if (res.length > 0) {
          setSelectedResource(res[0].resource_name);
        }
      })
      .catch(err => console.error(err));
  }, [location.state]);

  const handleSendRequest = async () => {
    if (!selectedResource) return;
    setLoading(true);
    setResponseResult(null);

    let parsedBody = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (e) {
        setResponseResult({
          status: 400,
          statusText: 'Client Error',
          durationMs: 0,
          data: { error: 'Invalid JSON request body format.' }
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Clean pathSuffix
      const cleanSuffix = pathSuffix.startsWith('/') ? pathSuffix.slice(1) : pathSuffix;
      const res = await api.callMockApi(selectedResource, method, cleanSuffix, parsedBody);
      setResponseResult(res);

      // Add to request history
      const historyItem = {
        method,
        url: `/api/mock/${selectedResource}${pathSuffix ? '/' + cleanSuffix : ''}`,
        status: res.status,
        durationMs: res.durationMs,
        time: new Date().toLocaleTimeString()
      };
      setRequestHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setResponseResult({
        status: 500,
        statusText: 'Server Error',
        durationMs: 0,
        data: { error: err.message || 'Network request failed' }
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurlSnippet = () => {
    const fullUrl = `http://localhost:8000/api/mock/${selectedResource}${pathSuffix ? (pathSuffix.startsWith('/') || pathSuffix.startsWith('?') ? pathSuffix : '/' + pathSuffix) : ''}`;
    let snippet = `curl -X ${method} "${fullUrl}"`;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      snippet += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n\s*/g, ' ')}'`;
    }
    return snippet;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <span>API Explorer</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Interactive developer HTTP console to query, mutate, and inspect live dataset-backed REST APIs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Request Form & Body (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* URL & Method Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Method Selector */}
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none ${
                  method === 'GET'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400'
                    : method === 'POST'
                    ? 'bg-blue-950/60 border-blue-700 text-blue-400'
                    : method === 'DELETE'
                    ? 'bg-rose-950/60 border-rose-700 text-rose-400'
                    : 'bg-amber-950/60 border-amber-700 text-amber-400'
                }`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              {/* Resource Selector */}
              <select
                value={selectedResource}
                onChange={e => setSelectedResource(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
              >
                {mockApis.length > 0 ? (
                  mockApis.map(m => (
                    <option key={m.id} value={m.resource_name}>
                      /api/mock/{m.resource_name}
                    </option>
                  ))
                ) : (
                  <option value="customers">/api/mock/customers</option>
                )}
              </select>

              {/* Path / Query Suffix */}
              <input
                type="text"
                value={pathSuffix}
                onChange={e => setPathSuffix(e.target.value)}
                placeholder="/1 or ?limit=10&search=test"
                className="flex-1 min-w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />

              {/* Send Button */}
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send'}</span>
              </button>
            </div>

            {/* Quick Suffix Presets */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span className="text-slate-500">Quick paths:</span>
              <button
                onClick={() => { setMethod('GET'); setPathSuffix('?limit=5'); }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 font-mono text-[10px]"
              >
                ?limit=5
              </button>
              <button
                onClick={() => { setMethod('GET'); setPathSuffix('?search=test'); }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 font-mono text-[10px]"
              >
                ?search=test
              </button>
              <button
                onClick={() => { setMethod('GET'); setPathSuffix('?sort_by=id&sort_dir=desc'); }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 font-mono text-[10px]"
              >
                ?sort=desc
              </button>
              <button
                onClick={() => { setMethod('GET'); setPathSuffix('/1'); }}
                className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 font-mono text-[10px]"
              >
                /1 (ID)
              </button>
            </div>
          </div>

          {/* Request Body Editor (shown for POST, PUT, PATCH) */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>JSON Request Body</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.callMockApi(selectedResource, 'GET', '?limit=1');
                        if (res.data?.data?.[0]) {
                          const sample = { ...res.data.data[0] };
                          delete sample.id;
                          delete sample.person_id;
                          delete sample.customer_id;
                          setRequestBody(JSON.stringify(sample, null, 2));
                        }
                      } catch (err) {
                        console.error('Failed to load sample', err);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-mono border border-indigo-500/30 transition-colors"
                  >
                    Load Sample Record
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono">application/json</span>
                </div>
              </div>
              <textarea
                rows={6}
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Live Response Panel */}
          {responseResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                      responseResult.status >= 200 && responseResult.status < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : responseResult.status >= 400
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {responseResult.status} {responseResult.statusText || 'OK'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {responseResult.durationMs}ms
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseResult.data, null, 2))}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </button>
              </div>

              {/* JSON Response Body */}
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
                {JSON.stringify(responseResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar: Snippets & Request History */}
        <div className="space-y-5">
          {/* cURL Snippet Card */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                cURL Snippet
              </span>
              <button
                onClick={() => copyToClipboard(getCurlSnippet())}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCurl ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
              {getCurlSnippet()}
            </pre>
          </div>

          {/* Request History */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recent Executions</h3>
              <span className="text-[10px] font-mono text-slate-500">{requestHistory.length} calls</span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {requestHistory.length > 0 ? (
                requestHistory.map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          h.method === 'GET' ? 'text-emerald-400' : 'text-blue-400'
                        }`}
                      >
                        {h.method}
                      </span>
                      <span className="text-slate-300 truncate text-[11px]">{h.url}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] flex-shrink-0">
                      <span>{h.status}</span>
                      <span>{h.durationMs}ms</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-500">
                  No requests executed yet. Click "Send" above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
