import { Company, ErrorCategory, CompanyComparison, QualityStats } from '@/types/data-quality';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  { type: 'scope1_error', description: 'Scope 1 utsläpp fel', color: '#f0759a' }, // pink-3
  { type: 'scope2_error', description: 'Scope 2 utsläpp fel', color: '#f48f2a' }, // orange-3
  { type: 'scope3_error', description: 'Scope 3 utsläpp fel', color: '#aae506' }, // green-3
  { type: 'currency_error', description: 'Fel valuta', color: '#59a0e1' }, // blue-3
  { type: 'unit_error', description: 'Fel enhet (ton/kton)', color: '#99cfff' }, // blue-2
  { type: 'missing_year', description: 'Saknar år', color: '#eea0b7' }, // pink-2
  { type: 'missing_revenue', description: 'Saknar omsättning', color: '#fdb768' }, // orange-2
  { type: 'revenue_close', description: 'Omsättning nästan rätt', color: '#d5fd63' }, // green-2
  { type: 'other', description: 'Annat fel', color: '#878787' }, // grey
];

export function compareCompanies(stageCompany: Company, prodCompany: Company): CompanyComparison {
  const errors: ErrorCategory[] = [];
  let totalFields = 8; // Fast antal fält vi kontrollerar
  let correctFields = 0;

  // Jämför scope 1 - alltid räkna som ett fält
  if (stageCompany.scope1 === prodCompany.scope1) {
    correctFields++;
  } else {
    // Kolla om det är ett enhetsproblem (ton vs kton)
    if (stageCompany.scope1 && prodCompany.scope1) {
      const ratio = Math.abs(stageCompany.scope1 / prodCompany.scope1);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_error')!);
      }
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_error')!);
    }
  }

  // Jämför scope 2
  if (stageCompany.scope2 === prodCompany.scope2) {
    correctFields++;
  } else {
    // Kolla enhetsproblem
    if (stageCompany.scope2 && prodCompany.scope2) {
      const ratio = Math.abs(stageCompany.scope2 / prodCompany.scope2);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_error')!);
      }
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_error')!);
    }
  }

  // Jämför scope 3
  if (stageCompany.scope3 === prodCompany.scope3) {
    correctFields++;
  } else {
    // Kolla enhetsproblem
    if (stageCompany.scope3 && prodCompany.scope3) {
      const ratio = Math.abs(stageCompany.scope3 / prodCompany.scope3);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_error')!);
      }
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_error')!);
    }
  }

  // Jämför valuta
  if (stageCompany.currency === prodCompany.currency) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
  }

  // Kontrollera år
  if (stageCompany.year === prodCompany.year) {
    correctFields++;
  } else {
    if (!stageCompany.year && prodCompany.year) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_year')!);
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
    }
  }

  // Kontrollera omsättning
  if (stageCompany.revenue === prodCompany.revenue) {
    correctFields++;
  } else {
    if (!stageCompany.revenue && prodCompany.revenue) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_revenue')!);
    } else if (stageCompany.revenue && prodCompany.revenue) {
      const difference = Math.abs(stageCompany.revenue - prodCompany.revenue) / prodCompany.revenue;
      if (difference < 0.1) {
        correctFields++; // Acceptabelt nära
      } else if (difference < 0.2) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_close')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
      }
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
    }
  }

  // Kontrollera namn
  if (stageCompany.name === prodCompany.name) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
  }

  // Kontrollera id
  if (stageCompany.id === prodCompany.id) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
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