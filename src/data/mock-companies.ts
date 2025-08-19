import { Company } from '@/types/data-quality';

export const mockStageCompanies: Company[] = [
  {
    wikidataId: "Q123456",
    name: "Tech Corp AB",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 15000, unit: "tCO2e" },
        scope2: { mb: 8000, lb: 7500, unit: "tCO2e" },
        scope3: { calculatedTotalEmissions: 45000 }
      },
      economy: {
        turnover: { value: 5000000, currency: "SEK" },
        employees: { value: 250, unit: "FTE" }
      }
    }]
  },
  {
    wikidataId: "Q789012",
    name: "Green Energy Ltd",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 2500, unit: "tCO2e" },
        scope2: { mb: 1200, lb: 1100, unit: "tCO2e" },
        scope3: { calculatedTotalEmissions: 12000 }
      },
      economy: {
        turnover: { value: 2500000, currency: "SEK" },
        employees: { value: 85, unit: "FTE" }
      }
    }]
  },
  {
    wikidataId: "Q345678",
    name: "Manufacturing Co",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 35000, unit: "tCO2e" },
        scope2: { mb: 18000, lb: 17000, unit: "tCO2e" },
        scope3: { calculatedTotalEmissions: 85000 }
      },
      economy: {
        turnover: { value: 15000000, currency: "SEK" },
        employees: { value: 750, unit: "FTE" }
      }
    }]
  }
];

export const mockProdCompanies: Company[] = [
  {
    wikidataId: "Q123456",
    name: "Tech Corp AB",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 14800, unit: "tCO2e" }, // Minor difference
        scope2: { mb: 8200, lb: 7600, unit: "tCO2e" }, // Minor differences
        scope3: { calculatedTotalEmissions: 46000 } // Minor difference
      },
      economy: {
        turnover: { value: 5100000, currency: "SEK" }, // Minor difference
        employees: { value: 252, unit: "FTE" } // Minor difference
      }
    }]
  },
  {
    wikidataId: "Q789012",
    name: "Green Energy Ltd",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 3500, unit: "tCO2e" }, // Major difference (40% increase)
        scope2: { mb: 1800, lb: 1700, unit: "tCO2e" }, // Major differences
        scope3: { calculatedTotalEmissions: 18000 } // Major difference (50% increase)
      },
      economy: {
        turnover: { value: 4000000, currency: "SEK" }, // Major difference (60% increase)
        employees: { value: 120, unit: "FTE" } // Major difference (41% increase)
      }
    }]
  },
  {
    wikidataId: "Q345678",
    name: "Manufacturing Co",
    reportingPeriods: [{
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      emissions: {
        scope1: { total: 34500, unit: "tCO2e" }, // Minor difference
        scope2: { mb: 17800, lb: 16900, unit: "tCO2e" }, // Minor differences
        scope3: { calculatedTotalEmissions: 84000 } // Minor difference
      },
      economy: {
        turnover: { value: 14800000, currency: "SEK" }, // Minor difference
        employees: { value: 745, unit: "FTE" } // Minor difference
      }
    }]
  }
];