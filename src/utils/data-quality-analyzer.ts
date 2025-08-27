import { Company, ErrorCategory, CompanyComparison, QualityStats, ReportingPeriod } from '@/types/data-quality';

export const ERROR_CATEGORIES: ErrorCategory[] = [
  { type: 'scope1_major_error', description: 'Scope 1 stort fel (>20%)', color: '#f0759a' }, // pink-3
  { type: 'scope1_minor_error', description: 'Scope 1 litet fel (5-20%)', color: '#eea0b7' }, // pink-2
  { type: 'scope2_major_error', description: 'Scope 2 stort fel (>20%)', color: '#f48f2a' }, // orange-3
  { type: 'scope2_minor_error', description: 'Scope 2 litet fel (5-20%)', color: '#fdb768' }, // orange-2
  { type: 'scope3_major_error', description: 'Scope 3 stort fel (>20%)', color: '#aae506' }, // green-3
  { type: 'scope3_minor_error', description: 'Scope 3 litet fel (5-20%)', color: '#d5fd63' }, // green-2
  { type: 'currency_error', description: 'Fel valuta', color: '#59a0e1' }, // blue-3
  { type: 'unit_error', description: 'Enhetsfel (olika skalor)', color: '#99cfff' }, // blue-2
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
  { type: 'wrong_fiscal_year', description: 'Fel räkenskapsår (data från annat år)', color: '#8b4513' }, // brown
  { type: 'data_structure_error', description: 'Strukturfel i data', color: '#878787' }, // grey
  { type: 'other', description: 'Annat fel', color: '#878787' }, // grey
  { type: 'perfect', description: 'Inga fel (100%)', color: '#4CAF50' }, // bright green
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
  let totalPenalty = 0; // Totalt straff i procent (0-100)

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
  if (stageCompany.wikidataId !== prodCompany.wikidataId) {
    // Detta borde aldrig hända eftersom vi matchar på wikidataId, men logga för säkerhets skull
    console.log(`🚨 ID mismatch för ${stageCompany.name}: stage=${stageCompany.wikidataId}, prod=${prodCompany.wikidataId}`);
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'data_structure_error')!);
    totalPenalty += 5; // Stort strukturellt fel
  }

  // Jämför valuta
  if (stageCurrency !== prodCurrency) {
    if (!stageCurrency && prodCurrency) {
      // Stage saknar data som finns i prod - detta är ett fel
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
      totalPenalty += 1; // Saknar värde (1%)
    } else if (stageCurrency && prodCurrency) {
      // Båda har värden men de skiljer sig
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'currency_error')!);
      totalPenalty += 2; // Fel värde (2%)
    }
    // Om stage har data som prod saknar räknas det som OK (ingen penalty)
  }

  // Kontrollera år först - endast jämför numeriska värden om åren matchar
  let yearsMatch = false;
  if (stageYear === prodYear) {
    yearsMatch = true;
  } else if (!stageYear && prodYear) {
    // Stage saknar år som finns i prod
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_year')!);
    totalPenalty += 1; // Saknar värde (1%)
  } else if (stageYear && !prodYear) {
    // Stage har år som saknas i prod - detta är OK
    yearsMatch = true; // Kan fortfarande jämföra data
  } else {
    // Båda har år men de skiljer sig
    errors.push(ERROR_CATEGORIES.find(e => e.type === 'year_mismatch')!);
    totalPenalty += 5; // Stort värdefel - jämför fel år (5%)
  }

  // Helper function to check if ratio indicates unit error (different scales)
  function isUnitError(ratio: number): boolean {
    // Check for various scale differences: 10x, 100x, 1000x, 10000x
    const scalingFactors = [10, 100, 1000, 10000];
    return scalingFactors.some(factor => 
      (ratio > factor * 0.9 && ratio < factor * 1.1) || 
      (ratio > (1/factor) * 0.9 && ratio < (1/factor) * 1.1)
    );
  }

  // Endast jämför numeriska värden om åren matchar (eller om prod saknar år)
  if (yearsMatch) {
    // Första, kolla om det finns konsistent enhetsproblem över flera scope
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

    // Kolla om det finns konsistent enhetsproblem (alla ratios indikerar samma skalningsfaktor)
    const hasConsistentUnitError = ratios.length >= 2 && ratios.every(ratio => isUnitError(ratio));

    if (hasConsistentUnitError) {
      // Lägg till ett enda enhetsproblem istället för individuella fel
      errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
      totalPenalty += 2; // Litet fel - tekniskt problem men rätt värden (2%)
    } else {
      // Jämför scope 1
      if (stageScope1 !== prodScope1) {
        if (stageScope1 === null || stageScope1 === undefined) {
          if (prodScope1 !== null && prodScope1 !== undefined) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope1')!);
            totalPenalty += 1; // Saknar värde (1%)
          }
        } else if (prodScope1 !== null && prodScope1 !== undefined) {
          const ratio = Math.abs(stageScope1 / prodScope1);
          if (isUnitError(ratio)) {
            // Detta är troligen ett enhetsfel snarare än ett dataf
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
            totalPenalty += 2; // Litet fel - tekniskt problem (2%)
          } else {
            const percentDiff = Math.abs(stageScope1 - prodScope1) / prodScope1;
            if (percentDiff > 0.2) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_major_error')!);
              totalPenalty += 5; // Stort värdefel (5%)
            } else if (percentDiff > 0.05) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope1_minor_error')!);
              totalPenalty += 2; // Litet fel (2%)
            }
          }
        }
        // Om stage har scope 1 som saknas i prod - detta är OK (ingen penalty)
      }

      // Jämför scope 2
      if (stageScope2 !== prodScope2) {
        if (stageScope2 === null || stageScope2 === undefined) {
          if (prodScope2 !== null && prodScope2 !== undefined) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope2')!);
            totalPenalty += 1; // Saknar värde (1%)
          }
        } else if (prodScope2 !== null && prodScope2 !== undefined) {
          const ratio = Math.abs(stageScope2 / prodScope2);
          if (isUnitError(ratio)) {
            // Detta är troligen ett enhetsfel snarare än ett datafel
            if (!errors.some(e => e.type === 'unit_error')) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
              totalPenalty += 2; // Litet fel - tekniskt problem (2%)
            }
          } else {
            const percentDiff = Math.abs(stageScope2 - prodScope2) / prodScope2;
            if (percentDiff > 0.2) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_major_error')!);
              totalPenalty += 5; // Stort värdefel (5%)
            } else if (percentDiff > 0.05) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope2_minor_error')!);
              totalPenalty += 2; // Litet fel (2%)
            }
          }
        }
        // Om stage har scope 2 som saknas i prod - detta är OK (ingen penalty)
      }

      // Jämför scope 3
      if (stageScope3 !== prodScope3) {
        if (stageScope3 === null || stageScope3 === undefined) {
          if (prodScope3 !== null && prodScope3 !== undefined) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_scope3')!);
            totalPenalty += 1; // Saknar värde (1%)
          }
        } else if (prodScope3 !== null && prodScope3 !== undefined) {
          const ratio = Math.abs(stageScope3 / prodScope3);
          if (isUnitError(ratio)) {
            // Detta är troligen ett enhetsfel snarare än ett datafel
            if (!errors.some(e => e.type === 'unit_error')) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
              totalPenalty += 2; // Litet fel - tekniskt problem (2%)
            }
          } else {
            const percentDiff = Math.abs(stageScope3 - prodScope3) / prodScope3;
            if (percentDiff > 0.2) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_major_error')!);
              totalPenalty += 5; // Stort värdefel (5%)
            } else if (percentDiff > 0.05) {
              errors.push(ERROR_CATEGORIES.find(e => e.type === 'scope3_minor_error')!);
              totalPenalty += 2; // Litet fel (2%)
            }
          }
        }
        // Om stage har scope 3 som saknas i prod - detta är OK (ingen penalty)
      }
    }

    // Kontrollera omsättning (endast om åren matchar)
    if (stageRevenue !== prodRevenue) {
      if (!stageRevenue && prodRevenue) {
        // Stage saknar omsättning som finns i prod
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_revenue')!);
        totalPenalty += 1; // Saknar värde (1%)
      } else if (stageRevenue && prodRevenue) {
        const revenueRatio = Math.abs(stageRevenue / prodRevenue);
        if (isUnitError(revenueRatio)) {
          // Detta är troligen ett enhetsfel snarare än ett datafel
          if (!errors.some(e => e.type === 'unit_error')) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'unit_error')!);
            totalPenalty += 2; // Litet fel - tekniskt problem (2%)
          }
        } else {
          const difference = Math.abs(stageRevenue - prodRevenue) / prodRevenue;
          if (difference >= 0.2) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_major_error')!);
            totalPenalty += 5; // Stort värdefel (5%)
          } else if (difference >= 0.1) {
            errors.push(ERROR_CATEGORIES.find(e => e.type === 'revenue_minor_error')!);
            totalPenalty += 2; // Litet fel (2%)
          }
        }
        // Under 10% skillnad räknas som OK (ingen penalty)
      }
      // Om stage har omsättning som prod saknar - detta är OK (ingen penalty)
    }

    // Kontrollera anställda (endast om åren matchar)
    if (stageEmployees !== prodEmployees) {
      if (!stageEmployees && prodEmployees) {
        // Stage saknar anställda som finns i prod
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'missing_employees')!);
        totalPenalty += 1; // Saknar värde (1%)
      } else if (stageEmployees && prodEmployees) {
        const difference = Math.abs(stageEmployees - prodEmployees) / prodEmployees;
        if (difference >= 0.2) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'employees_major_error')!);
          totalPenalty += 5; // Stort värdefel (5%)
        } else if (difference >= 0.1) {
          errors.push(ERROR_CATEGORIES.find(e => e.type === 'employees_minor_error')!);
          totalPenalty += 2; // Litet fel (2%)
        }
        // Under 10% skillnad räknas som OK (ingen penalty)
      }
      // Om stage har anställda som prod saknar - detta är OK (ingen penalty)
    }
  }
  // Om åren inte matchar hoppar vi över numeriska jämförelser (ingen penalty för detta)

  // Kolla om det finns fel räkenskapsår - data från ett år har rapporterats som data från ett annat år
  if (stageCompany.reportingPeriods.length > 1 || prodCompany.reportingPeriods.length > 1) {
    // Få alla rapportperioder med data för båda företagen
    const stagePeriodsWithData = stageCompany.reportingPeriods.filter(p => p.emissions || p.economy);
    const prodPeriodsWithData = prodCompany.reportingPeriods.filter(p => p.emissions || p.economy);
    
    if (stagePeriodsWithData.length > 0 && prodPeriodsWithData.length > 0) {
      // Jämför alla möjliga kombinationer av år för att hitta bättre matchningar
      let bestMatch = { stageYear: stageYear, prodYear: prodYear, matchScore: 0 };
      let currentMatchScore = 0;
      
      // Beräkna matchscore för nuvarande årjämförelse
      if (stageScope1 && prodScope1) {
        const diff = Math.abs(stageScope1 - prodScope1) / prodScope1;
        if (diff < 0.05) currentMatchScore += 3;
        else if (diff < 0.2) currentMatchScore += 1;
      }
      if (stageScope2 && prodScope2) {
        const diff = Math.abs(stageScope2 - prodScope2) / prodScope2;
        if (diff < 0.05) currentMatchScore += 3;
        else if (diff < 0.2) currentMatchScore += 1;
      }
      if (stageScope3 && prodScope3) {
        const diff = Math.abs(stageScope3 - prodScope3) / prodScope3;
        if (diff < 0.05) currentMatchScore += 3;
        else if (diff < 0.2) currentMatchScore += 1;
      }
      
      bestMatch.matchScore = currentMatchScore;
      
      // Testa alla andra kombinationer
      for (const stagePeriod of stagePeriodsWithData) {
        for (const prodPeriod of prodPeriodsWithData) {
          const testStageYear = new Date(stagePeriod.startDate).getFullYear();
          const testProdYear = new Date(prodPeriod.startDate).getFullYear();
          
          // Hoppa över redan testade kombinationen
          if (testStageYear === stageYear && testProdYear === prodYear) continue;
          
          const testStageScope1 = stagePeriod.emissions?.scope1?.total;
          const testProdScope1 = prodPeriod.emissions?.scope1?.total;
          const testStageScope2 = stagePeriod.emissions?.scope2?.calculatedTotalEmissions || stagePeriod.emissions?.scope2?.mb;
          const testProdScope2 = prodPeriod.emissions?.scope2?.calculatedTotalEmissions || prodPeriod.emissions?.scope2?.mb;
          const testStageScope3 = stagePeriod.emissions?.scope3?.calculatedTotalEmissions;
          const testProdScope3 = prodPeriod.emissions?.scope3?.calculatedTotalEmissions;
          
          let testMatchScore = 0;
          
          if (testStageScope1 && testProdScope1) {
            const diff = Math.abs(testStageScope1 - testProdScope1) / testProdScope1;
            if (diff < 0.05) testMatchScore += 3;
            else if (diff < 0.2) testMatchScore += 1;
          }
          if (testStageScope2 && testProdScope2) {
            const diff = Math.abs(testStageScope2 - testProdScope2) / testProdScope2;
            if (diff < 0.05) testMatchScore += 3;
            else if (diff < 0.2) testMatchScore += 1;
          }
          if (testStageScope3 && testProdScope3) {
            const diff = Math.abs(testStageScope3 - testProdScope3) / testProdScope3;
            if (diff < 0.05) testMatchScore += 3;
            else if (diff < 0.2) testMatchScore += 1;
          }
          
          // Om denna kombination ger betydligt bättre matchning, är det troligen fel räkenskapsår
          if (testMatchScore > bestMatch.matchScore + 2) { // Kräv betydlig förbättring
            bestMatch = { 
              stageYear: testStageYear, 
              prodYear: testProdYear, 
              matchScore: testMatchScore 
            };
          }
        }
      }
      
      // Om bästa matchningen inte är den ursprungliga års-kombinationen, rapportera fel
      if (bestMatch.stageYear !== stageYear || bestMatch.prodYear !== prodYear) {
        errors.push(ERROR_CATEGORIES.find(e => e.type === 'wrong_fiscal_year')!);
        totalPenalty += 3; // Måttligt fel - rätt data men fel år (3%)
      }
    }
  }

  // Beräkna noggrannhet baserat på viktade fel (100% - totalt straff)
  const correctnessPercentage = Math.max(0, Math.round(100 - totalPenalty));

  const result = {
    companyId: stageCompany.wikidataId,
    companyName: stageCompany.name,
    errors,
    correctnessPercentage,
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
    if (category.type === 'perfect') {
      // Speciell hantering för företag med 100% noggrannhet
      errorDistribution[category.type] = comparisons.filter(comp => 
        comp.correctnessPercentage === 100
      ).length;
    } else {
      errorDistribution[category.type] = comparisons.filter(comp => 
        comp.errors.some(error => error.type === category.type)
      ).length;
    }
  });

  // Skapa histogram över korrekthet med felkategorier (2% buckets)
  const histogram: Array<{ range: string; [key: string]: any }> = [];
  for (let i = 0; i <= 100; i += 2) {
    const rangeStart = i;
    const rangeEnd = Math.min(i + 1, 100);
    const companiesInRange = comparisons.filter(comp => 
      comp.correctnessPercentage >= rangeStart && comp.correctnessPercentage <= rangeEnd
    );
    
    const rangeData: { range: string; [key: string]: any } = {
      range: `${rangeStart}-${rangeEnd}%`,
      total: companiesInRange.length,
    };

    // Räkna fel per kategori för denna range
    ERROR_CATEGORIES.forEach(category => {
      if (category.type === 'perfect') {
        // Speciell hantering för företag med 100% noggrannhet
        rangeData[category.type] = companiesInRange.filter(comp => 
          comp.correctnessPercentage === 100
        ).length;
      } else {
        rangeData[category.type] = companiesInRange.filter(comp => 
          comp.errors.some(error => error.type === category.type)
        ).length;
      }
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