import {
  ColumnDefinition,
  SchemaItem,
  DatasetItem,
  DatasetPreview,
  GenerationJob,
  MockApiItem,
  ValidationReport,
  TemplateItem,
  PlatformStats
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const err = await res.json();
      if (err.detail) errorMsg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // System
  getHealth: () => fetch(`${API_BASE}/health`).then(r => handleResponse<any>(r)),
  getStats: () => fetch(`${API_BASE}/api/stats`).then(r => handleResponse<PlatformStats>(r)),

  // Domains
  getDomains: () => fetch(`${API_BASE}/api/domains`).then(r => handleResponse<{ domains: any[] }>(r)),
  getDomainDetail: (name: string) => fetch(`${API_BASE}/api/domains/${name}`).then(r => handleResponse<any>(r)),

  // Schemas
  listSchemas: () => fetch(`${API_BASE}/api/schemas`).then(r => handleResponse<SchemaItem[]>(r)),
  getSchema: (id: string) => fetch(`${API_BASE}/api/schemas/${id}`).then(r => handleResponse<SchemaItem>(r)),
  createSchema: (payload: { name: string; description?: string; primary_key?: string; columns: ColumnDefinition[] }) =>
    fetch(`${API_BASE}/api/schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<SchemaItem>(r)),
  updateSchema: (id: string, payload: Partial<SchemaItem>) =>
    fetch(`${API_BASE}/api/schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<SchemaItem>(r)),
  deleteSchema: (id: string) =>
    fetch(`${API_BASE}/api/schemas/${id}`, { method: 'DELETE' }).then(r => handleResponse<{ success: boolean }>(r)),

  // Generation
  previewGeneration: (payload: any) =>
    fetch(`${API_BASE}/api/generate/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<DatasetPreview>(r)),
  generateDataset: (payload: any) =>
    fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<any>(r)),
  listGenerations: () => fetch(`${API_BASE}/api/generations`).then(r => handleResponse<GenerationJob[]>(r)),

  // Datasets
  listDatasets: (search?: string, source?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (source) params.append('source', source);
    return fetch(`${API_BASE}/api/datasets?${params.toString()}`).then(r => handleResponse<DatasetItem[]>(r));
  },
  getDataset: (id: string) => fetch(`${API_BASE}/api/datasets/${id}`).then(r => handleResponse<DatasetItem>(r)),
  previewDataset: (id: string, limit = 50, offset = 0, search?: string, sortBy?: string, sortDir = 'asc') => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      sort_dir: sortDir,
      include_stats: 'true'
    });
    if (search) params.append('search', search);
    if (sortBy) params.append('sort_by', sortBy);
    return fetch(`${API_BASE}/api/datasets/${id}/preview?${params.toString()}`).then(r => handleResponse<DatasetPreview>(r));
  },
  deleteDataset: (id: string) =>
    fetch(`${API_BASE}/api/datasets/${id}`, { method: 'DELETE' }).then(r => handleResponse<{ success: boolean }>(r)),
  getExportUrl: (id: string, format = 'csv') => `${API_BASE}/api/datasets/${id}/export?format=${format}`,

  // Mock APIs
  listMockApis: () => fetch(`${API_BASE}/api/mock-apis`).then(r => handleResponse<MockApiItem[]>(r)),
  getMockApi: (id: string) => fetch(`${API_BASE}/api/mock-apis/${id}`).then(r => handleResponse<MockApiItem>(r)),
  createMockApi: (payload: any) =>
    fetch(`${API_BASE}/api/mock-apis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<MockApiItem>(r)),
  deleteMockApi: (id: string) =>
    fetch(`${API_BASE}/api/mock-apis/${id}`, { method: 'DELETE' }).then(r => handleResponse<{ success: boolean }>(r)),
  resetMockApi: (id: string) =>
    fetch(`${API_BASE}/api/mock-apis/${id}/reset`, { method: 'POST' }).then(r => handleResponse<any>(r)),

  // Dynamic Mock API Execution
  callMockApi: async (
    resource: string,
    method: string,
    pathSuffix = '',
    body?: any,
    headers?: Record<string, string>
  ) => {
    const url = `${API_BASE}/api/mock/${resource}${pathSuffix ? '/' + pathSuffix : ''}`;
    const t0 = performance.now();
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(headers || {}) },
      body: body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) ? JSON.stringify(body) : undefined
    });
    const durationMs = Math.round(performance.now() - t0);
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });

    let data;
    try {
      data = await res.json();
    } catch {
      data = await res.text();
    }
    return {
      status: res.status,
      statusText: res.statusText,
      durationMs,
      headers: respHeaders,
      data
    };
  },

  // Data Quality Lab
  validateDataset: (datasetId: string) =>
    fetch(`${API_BASE}/api/datasets/${datasetId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(r => handleResponse<ValidationReport>(r)),
  getQualityReport: (datasetId: string) =>
    fetch(`${API_BASE}/api/datasets/${datasetId}/quality-report`).then(r => handleResponse<ValidationReport>(r)),
  listReports: () => fetch(`${API_BASE}/api/reports`).then(r => handleResponse<ValidationReport[]>(r)),
  injectFaults: (datasetId: string, payload: any) =>
    fetch(`${API_BASE}/api/datasets/${datasetId}/fault-injection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<any>(r)),
  getReportExportUrl: (reportId: string, format = 'json') =>
    `${API_BASE}/api/reports/${reportId}/export?format=${format}`,

  // Relationship Designer
  generateRelational: (payload: any) =>
    fetch(`${API_BASE}/api/relationships/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => handleResponse<any>(r)),
  getSampleRelationalEcommerce: () =>
    fetch(`${API_BASE}/api/relationships/templates/sample-ecommerce`).then(r => handleResponse<any>(r)),

  // Templates
  listTemplates: () => fetch(`${API_BASE}/api/templates`).then(r => handleResponse<TemplateItem[]>(r)),
  getTemplate: (id: string) => fetch(`${API_BASE}/api/templates/${id}`).then(r => handleResponse<TemplateItem>(r)),

  // AI Copilot
  suggestSchemaFromPrompt: (prompt: string) =>
    fetch(`${API_BASE}/api/ai/schema-suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    }).then(r => handleResponse<any>(r)),
  explainQualityReport: (reportId?: string, checks?: any[]) =>
    fetch(`${API_BASE}/api/ai/explain-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId, checks_detail: checks })
    }).then(r => handleResponse<any>(r)),
  suggestTemplateByUse: (useCase: string) =>
    fetch(`${API_BASE}/api/ai/template-suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ industry_or_use_case: useCase })
    }).then(r => handleResponse<any>(r)),
};
