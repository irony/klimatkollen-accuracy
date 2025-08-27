import { Company, ErrorCategory, CompanyComparison, QualityStats, ReportingPeriod } from '@/types/data-quality';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  { type: 'scope1_major_error', description: 'Scope 1 stort fel (>20%)', color: '#f0759a' }, // pink-3
  { type: 'scope1_minor_error', description: 'Scope 1 litet fel (5-20%)', color: '#eea0b7' }, // pink-2
  { type: 'scope2_major_error', description: 'Scope 2 stort fel (>20%)', color: '#f48f2a' }, // orange-3
  { type: 'scope2_minor_error', description: 'Scope 2 litet fel (5-20%)', color: '#fdb768' }, // orange-2
  { type: 'scope3_major_error', description: 'Scope 3 stort fel (>20%)', color: '#aae506' }, // green-3
  { type: 'scope3_minor_error', description: 'Scope 3 litet fel (5-20%)', color: '#d5fd63' }, // green-2
  { type: 'currency_error', description: 'Fel valuta', color: '#59a0e1' }, // blue-3
  { type: 'unit_error', description: 'Konsistent enhetsproblem (tusental)', color: '#99cfff' }, // blue-2
  { type: 'missing_year', description: 'Saknar år', color: '#97455d' }, // pink-4
  { type: 'revenue_major_error', description: 'Omsättning stort fel (>20%)', color: '#b25f00' }, // orange-4
  { type: 'revenue_minor_error', description: 'Omsättning litet fel (10-20%)', color: '#fde7ce' }, // orange-1
  { type: 'employees_major_error', description: 'Anställda stort fel (>20%)', color: '#206288' }, // blue-4
  { type: 'employees_minor_error', description: 'Anställda litet fel (10-20%)', color: '#d4e7f7' }, // blue-1
  { type: 'missing_scope1', description: 'Saknar Scope 1 data', color: '#73263d' }, // pink-5
  { type: 'missing_scope2', description: 'Saknar Scope 2 data', color: '#6b3700' }, // orange-5
  { type: 'missing_scope3', description: 'Saknar Scope 3 data', color: '#3d4b16' }, // green-5
  { type: 'missing_revenue', description: 'Saknar omsättning', color: '#13364e' }, // blue-5
  { type: 'missing_employees', description: 'Saknar anställda', color: '#878787' }, // grey
  { type: 'year_mismatch', description: 'Fel rapportår', color: '#6c9105' }, // green-4
  { type: 'data_structure_error', description: 'Strukturfel i data', color: '#878787' }, // grey
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
  let totalFields = 7; // wikidataId, currency, year, scope1, scope2, scope3, revenue, employees
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
  
  const stageEmployees = stagePeriod?.economy?.employees?.value;
  const prodEmployees = prodPeriod?.economy?.employees?.value;
  
  const stageYear = stagePeriod ? new Date(stagePeriod.startDate).getFullYear() : undefined;
  const prodYear = prodPeriod ? new Date(prodPeriod.startDate).getFullYear() : undefined;

  // Kontrollera wikidataId (ignorerar företagsnamn enligt användares önskemål)
  if (stageCompany.wikidataId === prodCompany.wikidataId) {
    correctFields++;
  } else {
    // Detta borde aldrig hända eftersom vi matchar på wikidataId, men logga för säkerhets skull
    console.log(`🚨 ID mismatch för ${stageCompany.name}: stage=${stageCompany.wikidataId}, prod=${prodCompany.wikidataId}`);
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
  }

  // Jämför valuta
  if (stageCurrency === prodCurrency) {
    correctFields++;
  } else if (!stageCurrency && prodCurrency) {
    // Stage saknar data som finns i prod - detta är ett fel
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
  } else if (stageCurrency && !prodCurrency) {
    // Stage har data som saknas i prod - detta är OK, räkna som korrekt
    correctFields++;
  } else {
    // Båda har värden men de skiljer sig
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
  }

  // Kontrollera år först - endast jämför numeriska värden om åren matchar
  let yearsMatch = false;
  if (stageYear === prodYear) {
    correctFields++;
    yearsMatch = true;
  } else if (!stageYear && prodYear) {
    // Stage saknar år som finns i prod
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_year')!);
  } else if (stageYear && !prodYear) {
    // Stage har år som saknas i prod - detta är OK
    correctFields++;
    yearsMatch = true; // Kan fortfarande jämföra data
  } else {
    // Båda har år men de skiljer sig
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'year_mismatch')!);
  }

  // Endast jämför numeriska värden om åren matchar (eller om prod saknar år)
  if (yearsMatch) {
    // Först kolla om det finns konsistent enhetsproblem (tusental vs enheter)
    const ratios: number[] = [];
    const hasValues = { scope1: false, scope2: false, scope3: false };
    
    if (stageScope1 && prodScope1) {
      ratios.push(Math.abs(stageScope1 / prodScope1));
      hasValues.scope1 = true;
    }
    if (stageScope2 && prodScope2) {
      ratios.push(Math.abs(stageScope2 / prodScope2));
      hasValues.scope2 = true;
    }
    if (stageScope3 && prodScope3) {
      ratios.push(Math.abs(stageScope3 / prodScope3));
      hasValues.scope3 = true;
    }

    // Kolla om det finns konsistent tusental-problem (alla ratios omkring 1000 eller 0.001)
    const hasConsistentUnitError = ratios.length >= 2 && ratios.every(ratio => 
      (ratio > 900 && ratio < 1100) || (ratio > 0.0009 && ratio < 0.0011)
    );

    if (hasConsistentUnitError) {
      // Lägg till ett enda enhetsproblem istället för individuella fel
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      // Räkna alla fält med värden som korrekta (enhetsproblem är fixat)
      if (hasValues.scope1) correctFields++;
      if (hasValues.scope2) correctFields++;
      if (hasValues.scope3) correctFields++;
    } else {
      // Jämför scope 1
      if (stageScope1 === prodScope1) {
        correctFields++;
      } else if (stageScope1 === null || stageScope1 === undefined) {
        if (prodScope1 !== null && prodScope1 !== undefined) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope1')!);
        } else {
          correctFields++;
        }
      } else if (prodScope1 === null || prodScope1 === undefined) {
        // Stage har scope 1 som saknas i prod - detta är OK
        correctFields++;
      } else {
        const percentDiff = Math.abs(stageScope1 - prodScope1) / prodScope1;
        if (percentDiff > 0.2) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_major_error')!);
        } else if (percentDiff > 0.05) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_minor_error')!);
        } else {
          correctFields++; // Inom 5% acceptabelt
        }
      }

      // Jämför scope 2
      if (stageScope2 === prodScope2) {
        correctFields++;
      } else if (stageScope2 === null || stageScope2 === undefined) {
        if (prodScope2 !== null && prodScope2 !== undefined) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope2')!);
        } else {
          correctFields++;
        }
      } else if (prodScope2 === null || prodScope2 === undefined) {
        // Stage har scope 2 som saknas i prod - detta är OK
        correctFields++;
      } else {
        const percentDiff = Math.abs(stageScope2 - prodScope2) / prodScope2;
        if (percentDiff > 0.2) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_major_error')!);
        } else if (percentDiff > 0.05) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_minor_error')!);
        } else {
          correctFields++; // Inom 5% acceptabelt
        }
      }

      // Jämför scope 3
      if (stageScope3 === prodScope3) {
        correctFields++;
      } else if (stageScope3 === null || stageScope3 === undefined) {
        if (prodScope3 !== null && prodScope3 !== undefined) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope3')!);
        } else {
          correctFields++;
        }
      } else if (prodScope3 === null || prodScope3 === undefined) {
        // Stage har scope 3 som saknas i prod - detta är OK
        correctFields++;
      } else {
        const percentDiff = Math.abs(stageScope3 - prodScope3) / prodScope3;
        if (percentDiff > 0.2) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_major_error')!);
        } else if (percentDiff > 0.05) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_minor_error')!);
        } else {
          correctFields++; // Inom 5% acceptabelt
        }
      }
    }

    // Kontrollera omsättning (endast om åren matchar)
    if (stageRevenue === prodRevenue) {
      correctFields++;
    } else if (!stageRevenue && prodRevenue) {
      // Stage saknar omsättning som finns i prod
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_revenue')!);
    } else if (stageRevenue && !prodRevenue) {
      // Stage har omsättning som saknas i prod - detta är OK
      correctFields++;
    } else if (stageRevenue && prodRevenue) {
      const difference = Math.abs(stageRevenue - prodRevenue) / prodRevenue;
      if (difference < 0.1) {
        correctFields++; // Inom 10% acceptabelt
      } else if (difference < 0.2) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_minor_error')!);
      } else {
        // Kolla om det är enhetsproblem (tusental vs miljoner)
        const revenueRatio = Math.abs(stageRevenue / prodRevenue);
        if (revenueRatio > 900 && revenueRatio < 1100) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
        } else {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_major_error')!);
        }
      }
    }

    // Kontrollera anställda (endast om åren matchar)
    if (stageEmployees === prodEmployees) {
      correctFields++;
    } else if (!stageEmployees && prodEmployees) {
      // Stage saknar anställda som finns i prod
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_employees')!);
    } else if (stageEmployees && !prodEmployees) {
      // Stage har anställda som saknas i prod - detta är OK
      correctFields++;
    } else if (stageEmployees && prodEmployees) {
      const difference = Math.abs(stageEmployees - prodEmployees) / prodEmployees;
      if (difference < 0.1) {
        correctFields++; // Inom 10% acceptabelt
      } else if (difference < 0.2) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'employees_minor_error')!);
      } else {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'employees_major_error')!);
      }
    }
  } else {
    // Om åren inte matchar, räkna numeriska fält som "hoppar över" (ej tillämpliga)
    // Lägg till korrekt antal för att behålla korrekt procentberäkning
    correctFields += 5; // scope1, scope2, scope3, revenue, employees - alla räknas som "ok" när åren inte matchar
  }

  const result = {
    companyId: stageCompany.wikidataId,
    companyName: stageCompany.name,
    errors,
    correctnessPercentage: Math.round(correctFields / totalFields * 100),
    comparisonDetails: {
      scope1: { stage: stageScope1, prod: prodScope1 },
      scope2: { stage: stageScope2, prod: prodScope2 },
      scope3: { stage: stageScope3, prod: prodScope3 },
      currency: { stage: stageCurrency, prod: prodCurrency },
      revenue: { stage: stageRevenue, prod: prodRevenue },
      employees: { stage: stageEmployees, prod: prodEmployees },
      year: { stage: stageYear, prod: prodYear }
    }
  };

  return result;
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
    averageCorrectness,
    errorDistribution,
    correctnessHistogram: histogram,
  };
}