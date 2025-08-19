import { Company, ErrorCategory, CompanyComparison, QualityStats, ReportingPeriod } from '@/types/data-quality';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  { type: 'scope1_error', description: 'Scope 1 utsläpp fel', color: '#f0759a' }, // pink-3
  { type: 'scope2_error', description: 'Scope 2 utsläpp fel', color: '#f48f2a' }, // orange-3
  { type: 'scope3_error', description: 'Scope 3 utsläpp fel', color: '#aae506' }, // green-3
  { type: 'currency_error', description: 'Fel valuta', color: '#59a0e1' }, // blue-3
  { type: 'unit_error', description: 'Fel enhet (ton/kton)', color: '#99cfff' }, // blue-2
  { type: 'missing_year', description: 'Saknar år', color: '#eea0b7' }, // pink-2
  { type: 'missing_revenue', description: 'Saknar omsättning', color: '#fdb768' }, // orange-2
  { type: 'revenue_close', description: 'Omsättning nästan rätt', color: '#d5fd63' }, // green-2
  { type: 'missing_scope1', description: 'Saknar Scope 1 data', color: '#f0759a' }, // pink-3 variant
  { type: 'missing_scope2', description: 'Saknar Scope 2 data', color: '#f48f2a' }, // orange-3 variant
  { type: 'missing_scope3', description: 'Saknar Scope 3 data', color: '#aae506' }, // green-3 variant
  { type: 'year_mismatch', description: 'Fel rapportår', color: '#97455d' }, // pink-4
  { type: 'name_mismatch', description: 'Företagsnamn skiljer sig', color: '#6c9105' }, // green-4
  { type: 'id_mismatch', description: 'ID:n matchar inte', color: '#206288' }, // blue-4
  { type: 'data_structure_error', description: 'Strukturfel i data', color: '#b25f00' }, // orange-4
  { type: 'other', description: 'Annat fel', color: '#878787' }, // grey
];

function getLatestReportingPeriod(company: Company): ReportingPeriod | null {
  if (!company.reportingPeriods || company.reportingPeriods.length === 0) {
    return null;
  }
  
  // Sortera efter startDate och ta senaste
  const sorted = company.reportingPeriods
    .filter(period => period.emissions || period.economy)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  return sorted[0] || null;
}

export function compareCompanies(stageCompany: Company, prodCompany: Company): CompanyComparison {
  const errors: ErrorCategory[] = [];
  let totalFields = 8; // Fast antal fält vi kontrollerar
  let correctFields = 0;

  const stagePeriod = getLatestReportingPeriod(stageCompany);
  const prodPeriod = getLatestReportingPeriod(prodCompany);

  // Extrahera data för jämförelse
  const stageScope1 = stagePeriod?.emissions?.scope1?.total;
  const prodScope1 = prodPeriod?.emissions?.scope1?.total;
  
  const stageScope2 = stagePeriod?.emissions?.scope2?.calculatedTotalEmissions || stagePeriod?.emissions?.scope2?.mb;
  const prodScope2 = prodPeriod?.emissions?.scope2?.calculatedTotalEmissions || prodPeriod?.emissions?.scope2?.mb;
  
  const stageScope3 = stagePeriod?.emissions?.scope3?.calculatedTotalEmissions;
  const prodScope3 = prodPeriod?.emissions?.scope3?.calculatedTotalEmissions;
  
  const stageCurrency = stagePeriod?.economy?.turnover?.currency;
  const prodCurrency = prodPeriod?.economy?.turnover?.currency;
  
  const stageRevenue = stagePeriod?.economy?.turnover?.value;
  const prodRevenue = prodPeriod?.economy?.turnover?.value;
  
  const stageYear = stagePeriod ? new Date(stagePeriod.startDate).getFullYear() : undefined;
  const prodYear = prodPeriod ? new Date(prodPeriod.startDate).getFullYear() : undefined;

  // Jämför scope 1
  if (stageScope1 === prodScope1) {
    correctFields++;
  } else {
    if (stageScope1 === null || stageScope1 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope1')!);
    } else if (prodScope1 === null || prodScope1 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    } else {
      const ratio = Math.abs(stageScope1 / prodScope1);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_error')!);
      }
    }
  }

  // Jämför scope 2
  if (stageScope2 === prodScope2) {
    correctFields++;
  } else {
    if (stageScope2 === null || stageScope2 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope2')!);
    } else if (prodScope2 === null || prodScope2 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    } else {
      const ratio = Math.abs(stageScope2 / prodScope2);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_error')!);
      }
    }
  }

  // Jämför scope 3
  if (stageScope3 === prodScope3) {
    correctFields++;
  } else {
    if (stageScope3 === null || stageScope3 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope3')!);
    } else if (prodScope3 === null || prodScope3 === undefined) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    } else {
      const ratio = Math.abs(stageScope3 / prodScope3);
      if (ratio > 900 && ratio < 1100) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_error')!);
      }
    }
  }

  // Jämför valuta
  if (stageCurrency === prodCurrency) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
  }

  // Kontrollera år
  if (stageYear === prodYear) {
    correctFields++;
  } else {
    if (!stageYear && prodYear) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_year')!);
    } else if (stageYear && !prodYear) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'year_mismatch')!);
    }
  }

  // Kontrollera omsättning
  if (stageRevenue === prodRevenue) {
    correctFields++;
  } else {
    if (!stageRevenue && prodRevenue) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_revenue')!);
    } else if (stageRevenue && !prodRevenue) {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    } else if (stageRevenue && prodRevenue) {
      const difference = Math.abs(stageRevenue - prodRevenue) / prodRevenue;
      if (difference < 0.1) {
        correctFields++; // Acceptabelt nära
      } else if (difference < 0.2) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_close')!);
      } else {
        // Kolla om det är enhetsproblem (tusental vs miljoner)
        const revenueRatio = Math.abs(stageRevenue / prodRevenue);
        if (revenueRatio > 900 && revenueRatio < 1100) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
        } else {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'other')!);
        }
      }
    } else {
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    }
  }

  // Kontrollera namn
  if (stageCompany.name === prodCompany.name) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'name_mismatch')!);
  }

  // Kontrollera wikidataId
  if (stageCompany.wikidataId === prodCompany.wikidataId) {
    correctFields++;
  } else {
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'id_mismatch')!);
  }

  const correctnessPercentage = totalFields > 0 ? (correctFields / totalFields) * 100 : 100;

  return {
    companyId: stageCompany.wikidataId,
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

  // Skapa histogram över korrekthet med felkategorier (5% buckets)
  const histogram: Array<{ range: string; [key: string]: any }> = [];
  for (let i = 0; i <= 100; i += 5) {
    const rangeStart = i;
    const rangeEnd = Math.min(i + 4, 100);
    const companiesInRange = comparisons.filter(comp => 
      comp.correctnessPercentage >= rangeStart && comp.correctnessPercentage <= rangeEnd
    );
    
    const rangeData: { range: string; [key: string]: any } = {
      range: `${rangeStart}-${rangeEnd}%`,
      total: companiesInRange.length,
    };

    // Räkna fel per kategori för denna range
    ERROR_CATEGORIES.forEach(category => {
      rangeData[category.type] = companiesInRange.filter(comp => 
        comp.errors.some(error => error.type === category.type)
      ).length;
    });
    
    histogram.push(rangeData);
  }

  return {
    totalCompanies,
    averageCorrectness: Math.round(averageCorrectness * 100) / 100,
    errorDistribution,
    correctnessHistogram: histogram,
  };
}