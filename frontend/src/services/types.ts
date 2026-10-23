export interface ColumnDefinition {
  name: string;
  dtype: string; // "str" | "int" | "float" | "bool" | "date" | "timestamp" | "enum" | "email" | "uuid"
  semantic_type?: string;
  nullable?: boolean;
  description?: string;
  min_value?: number | null;
  max_value?: number | null;
  accepted_values?: string[] | null;
  max_length?: number | null;
}

export interface SchemaItem {
  id: string;
  name: string;
  description: string;
  primary_key: string;
  columns: ColumnDefinition[];
  created_at: string;
  updated_at: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  description: string;
  row_count: number;
  column_count: number;
  columns_meta: Array<{ name: string; dtype: string; sample: string }>;
  file_format: string;
  size_bytes: number;
  source: string;
  is_fault_injected: boolean;
  parent_dataset_id?: string;
  created_at: string;
}

export interface DatasetPreview {
  dataset_id?: string;
  name?: string;
  total_rows: number;
  filtered_rows?: number;
  preview_rows?: number;
  limit?: number;
  offset?: number;
  columns: string[];
  dtypes: Record<string, string>;
  records: Record<string, any>[];
  column_stats?: Record<string, any>;
}

export interface GenerationJob {
  id: string;
  dataset_id?: string;
  schema_name: string;
  status: string;
  requested_rows: number;
  actual_rows: number;
  duration_seconds: number;
  seed?: number;
  error_message?: string;
  created_at: string;
}

export interface MockApiItem {
  id: string;
  dataset_id: string;
  resource_name: string;
  primary_key: string;
  is_active: boolean;
  allowed_methods: string[];
  pagination_config: { default_limit: number; max_limit: number };
  filterable_fields: string[];
  sortable_fields: string[];
  total_requests: number;
  base_endpoint: string;
  endpoints_docs: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CheckResult {
  check_name: string;
  category: string;
  passed: boolean;
  description: string;
  score_impact: number;
  affected_count: number;
  affected_columns: string[];
  representative_errors: string[];
  suggested_fix?: string;
}

export interface ValidationReport {
  id: string;
  dataset_id: string;
  dataset_name: string;
  quality_score: number;
  status: "PASSED" | "WARNING" | "FAILED";
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  summary: Record<string, any>;
  checks: CheckResult[];
  scoring_formula: string;
  created_at: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  intended_use: string;
  default_rows: number;
  primary_key: string;
  columns: ColumnDefinition[];
}

export interface PlatformStats {
  total_datasets: number;
  total_records: number;
  saved_schemas: number;
  active_mock_apis: number;
  total_api_requests: number;
  average_quality_score: number;
  recent_jobs: any[];
  format_distribution: Record<string, number>;
}
