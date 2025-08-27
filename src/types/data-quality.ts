export interface ReportingPeriod {
  startDate: string;
  endDate: string;
  reportURL?: string;
  emissions?: {
    calculatedTotalEmissions?: number;
    scope1?: {
      total: number;
      unit: string;
    } | null;
    scope2?: {
      mb?: number;
      lb?: number;
      calculatedTotalEmissions?: number;
      unit: string;
    } | null;
    scope3?: {
      calculatedTotalEmissions?: number;
      statedTotalEmissions?: {
        total: number;
        unit: string;
      } | null;
    } | null;
    statedTotalEmissions?: {
      total: number;
      unit: string;
    } | null;
  } | null;
  economy?: {
    turnover?: {
      value: number;
      currency: string;
    } | null;
    employees?: {
      value: number;
      unit: string;
    } | null;
  } | null;
}

export interface Company {
  wikidataId: string;
  name: string;
  lei?: string;
  description?: string;
  reportingPeriods: ReportingPeriod[];
  industry?: {
    industryGics?: {
      sectorCode: string;
      groupCode: string;
      industryCode: string;
      subIndustryCode: string;
    };
  };
  baseYear?: {
    year: number;
  };
  tags?: string[];
}

export interface ErrorCategory {
  type: 'scope1_major_error' | 'scope1_minor_error' | 'scope2_major_error' | 'scope2_minor_error' | 
        'scope3_major_error' | 'scope3_minor_error' | 'currency_error' | 'unit_error' | 
        'missing_year' | 'revenue_major_error' | 'revenue_minor_error' | 'employees_major_error' | 
        'employees_minor_error' | 'missing_scope1' | 'missing_scope2' | 'missing_scope3' | 
        'missing_revenue' | 'missing_employees' | 'year_mismatch' | 'wrong_fiscal_year' | 
        'data_structure_error' | 'other' | 'perfect';
  description: string;
  color: string;
}

export interface CompanyComparison {
  companyId: string;
  companyName: string;
  errors: ErrorCategory[];
  correctnessPercentage: number;
  comparisonDetails: {
    scope1: { stage: number | null; prod: number | null };
    scope2: { stage: number | null; prod: number | null };
    scope3: { stage: number | null; prod: number | null };
    currency: { stage: string | null; prod: string | null };
    revenue: { stage: number | null; prod: number | null };
    employees: { stage: number | null; prod: number | null };
    year: { stage: number | null; prod: number | null };
  };
  fiscalYearError?: {
    originalComparison: { stageYear: number; prodYear: number };
    betterMatch: { stageYear: number; prodYear: number };
    originalMatchScore: number;
    betterMatchScore: number;
  };
}

export interface QualityStats {
  totalCompanies: number;
  averageCorrectness: number;
  errorDistribution: Record<string, number>;
  correctnessHistogram: Array<{ range: string; [key: string]: any }>;
}