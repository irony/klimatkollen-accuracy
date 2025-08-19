import { Company, ErrorCategory, CompanyComparison, QualityStats } from '@/types/data-quality';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  { type: 'scope1_error', description: 'Scope 1 utsläpp fel', color: '#ef4444' },
  { type: 'scope2_error', description: 'Scope 2 utsläpp fel', color: '#f97316' },
  { type: 'scope3_error', description: 'Scope 3 utsläpp fel', color: '#eab308' },
  { type: 'currency_error', description: 'Fel valuta', color: '#22c55e' },
  { type: 'unit_error', description: 'Fel enhet (ton/kton)', color: '#3b82f6' },
  { type: 'missing_year', description: 'Saknar år', color: '#a855f7' },
  { type: 'missing_revenue', description: 'Saknar omsättning', color: '#ec4899' },
  { type: 'revenue_close', description: 'Omsättning nästan rätt', color: '#14b8a6' },
  { type: 'other', description: 'Annat fel', color: '#6b7280' },
];

export function compareCompanies(stageCompany: Company, prodCompany: Company): CompanyComparison {
  const errors: ErrorCategory[] = [];
  let totalFields = 0;
  let correctFields = 0;

  // Jämför scope 1
  if (stageCompany.scope1 !== undefined || prodCompany.scope1 !== undefined) {
    totalFields++;
    if (stageCompany.scope1 !== prodCompany.scope1) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_error')!);
    } else {
      correctFields++;
    }
  }

  // Jämför scope 2
  if (stageCompany.scope2 !== undefined || prodCompany.scope2 !== undefined) {
    totalFields++;
    if (stageCompany.scope2 !== prodCompany.scope2) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_error')!);
    } else {
      correctFields++;
    }
  }

  // Jämför scope 3
  if (stageCompany.scope3 !== undefined || prodCompany.scope3 !== undefined) {
    totalFields++;
    if (stageCompany.scope3 !== prodCompany.scope3) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_error')!);
    } else {
      correctFields++;
    }
  }

  // Jämför valuta
  if (stageCompany.currency !== undefined || prodCompany.currency !== undefined) {
    totalFields++;
    if (stageCompany.currency !== prodCompany.currency) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
    } else {
      correctFields++;
    }
  }

  // Kontrollera enhetsproblem (skillnad på 1000x kan indikera ton vs kton)
  if (stageCompany.scope1 && prodCompany.scope1) {
    const ratio = Math.abs(stageCompany.scope1 / prodCompany.scope1);
    if (ratio > 900 && ratio < 1100) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
    }
  }

  // Kontrollera saknade år
  if (!stageCompany.year && prodCompany.year) {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_year')!);
  }

  // Kontrollera saknade omsättning
  if (!stageCompany.revenue && prodCompany.revenue) {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_revenue')!);
  }

  // Kontrollera om omsättning är nära rätt (inom 10%)
  if (stageCompany.revenue && prodCompany.revenue) {
    totalFields++;
    const difference = Math.abs(stageCompany.revenue - prodCompany.revenue) / prodCompany.revenue;
    if (difference > 0.1) {
      if (difference < 0.2) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_close')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
      }
    } else {
      correctFields++;
    }
  }

  const correctnessPercentage = totalFields > 0 ? (correctFields / totalFields) * 100 : 100;

  return {
    companyId: stageCompany.id,
    companyName: stageCompany.name,
    errors,
    correctnessPercentage: Math.round(correctnessPercentage),
  };
}

export function generateQualityStats(comparisons: CompanyComparison[]): QualityStats {
  const totalCompanies = comparisons.length;
  const averageCorrectness = comparisons.reduce((sum, comp) => sum + comp.correctnessPercentage, 0) / totalCompanies;

  // Räkna fel per kategori
  const errorDistribution: Record<string, number> = {};
  ERROR_CATEGORIES.forEach(category => {
    errorDistribution[category.type] = comparisons.filter(comp => 
      comp.errors.some(error => error.type === category.type)
    ).length;
  });

  // Skapa histogram över korrekthet (5% buckets)
  const histogram: Array<{ range: string; count: number; percentage: number }> = [];
  for (let i = 0; i <= 100; i += 5) {
    const rangeStart = i;
    const rangeEnd = Math.min(i + 4, 100);
    const count = comparisons.filter(comp => 
      comp.correctnessPercentage >= rangeStart && comp.correctnessPercentage <= rangeEnd
    ).length;
    
    histogram.push({
      range: `${rangeStart}-${rangeEnd}%`,
      count,
      percentage: (count / totalCompanies) * 100,
    });
  }

  return {
    totalCompanies,
    averageCorrectness: Math.round(averageCorrectness * 100) / 100,
    errorDistribution,
    correctnessHistogram: histogram,
  };
}