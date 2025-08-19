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
  correctnessHistogram: Array<{ range: string; [key: string]: any }>;
}