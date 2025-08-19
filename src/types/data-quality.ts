export interface Company {
  id: string;
  name: string;
  scope1?: number;
  scope2?: number;
  scope3?: number;
  currency?: string;
  revenue?: number;
  year?: number;
  [key: string]: any;
}

export interface ErrorCategory {
  type: 'scope1_error' | 'scope2_error' | 'scope3_error' | 'currency_error' | 'unit_error' | 'missing_year' | 'missing_revenue' | 'revenue_close' | 'other';
  description: string;
  color: string;
}

export interface CompanyComparison {
  companyId: string;
  companyName: string;
  errors: ErrorCategory[];
  correctnessPercentage: number;
}

export interface QualityStats {
  totalCompanies: number;
  averageCorrectness: number;
  errorDistribution: Record<string, number>;
  correctnessHistogram: Array<{ range: string; count: number; percentage: number }>;
}