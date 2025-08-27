import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Company, CompanyComparison, QualityStats } from '@/types/data-quality';
import { compareCompanies, generateQualityStats, ERROR_CATEGORIES } from '@/utils/data-quality-analyzer';
import { useToast } from '@/hooks/use-toast';

export default function DataQualityDashboard() {
  console.log('DataQualityDashboard: Component rendering...');
  
  const [stageData, setStageData] = useState<Company[]>([]);
  const [prodData, setProdData] = useState<Company[]>([]);
  const [comparisons, setComparisons] = useState<CompanyComparison[]>([]);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('DataQualityDashboard: useEffect running, calling fetchData...');
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('DataQualityDashboard: fetchData starting...');
    try {
      setLoading(true);
      
      console.log('DataQualityDashboard: Fetching from APIs...');
      // Fetch from real APIs directly
      const [stageResponse, prodResponse] = await Promise.all([
        fetch('https://stage-api.klimatkollen.se/api/companies'),
        fetch('https://api.klimatkollen.se/api/companies')
      ]);

      if (!stageResponse.ok || !prodResponse.ok) {
        throw new Error('Failed to fetch from one or both APIs');
      }

      const stageCompanies: Company[] = await stageResponse.json();
      const prodCompanies: Company[] = await prodResponse.json();
      
      console.log(`DataQualityDashboard: Loaded ${stageCompanies.length} stage companies and ${prodCompanies.length} prod companies`);

      setStageData(stageCompanies);
      setProdData(prodCompanies);

      // Jämför företagen
      const comparisonResults: CompanyComparison[] = [];
      stageCompanies.forEach(stageCompany => {
        const prodCompany = prodCompanies.find(p => p.wikidataId === stageCompany.wikidataId);
        if (prodCompany) {
          comparisonResults.push(compareCompanies(stageCompany, prodCompany));
        }
      });

      setComparisons(comparisonResults);
      setQualityStats(generateQualityStats(comparisonResults));

      toast({
        title: "Data laddad",
        description: `Jämförde ${comparisonResults.length} företag mellan stage och prod`,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fel vid laddning",
        description: "Kunde inte hämta data från API:erna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log('DataQualityDashboard: Render phase', { loading, qualityStats: !!qualityStats });

  if (loading) {
    console.log('DataQualityDashboard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Laddar data...</h2>
          <p className="text-muted-foreground">Hämtar företagsdata från stage och prod API:er</p>
        </div>
      </div>
    );
  }

  if (!qualityStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Kunde inte ladda data</h2>
          <p className="text-muted-foreground">Det uppstod ett fel vid hämtning av data</p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    total: {
      label: "Totalt antal företag",
      color: "hsl(var(--muted-foreground))",
    },
    ...ERROR_CATEGORIES.reduce((acc, category) => {
      acc[category.type] = {
        label: category.description,
        color: category.color,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>)
  };

  const errorChartData = ERROR_CATEGORIES.map(category => ({
    category: category.description,
    count: qualityStats.errorDistribution[category.type] || 0,
    color: category.color,
  }));

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black-3 flex flex-col">
      <main className="grow container mx-auto px-4 pt-24 pb-12">
        <div className="space-y-8 md:space-y-16 max-w-[1400px] mx-auto">
          
          {/* Header Section */}
          <div className="bg-black-2 rounded-level-1 py-4 md:py-8">
            <div className="px-4 md:px-16">
              <div className="space-y-4 mb-6 md:mb-12">
                <p className="tracking-tight font-light text-4xl lg:text-6xl">Datakvalitetsanalys</p>
                <p className="tracking-tight font-light text-sm md:text-base lg:text-lg max-w-3xl text-grey">
                  Pipeline-kvalitet för hållbarhetsrapporter mellan stage och prod miljöer
                </p>
              </div>

              {/* Key Stats */}
              <div className="@container mt-3 md:mt-0">
                <div className="mt-8 @md:mt-12 bg-black-1 rounded-level-2 p-6">
                  <div className="grid grid-cols-1 @md:grid-cols-2 gap-4 @md:gap-8">
                    <div>
                      <p className="tracking-tight text-base md:mb-2 font-bold">Analyserade företag</p>
                      <div className="flex items-baseline gap-4">
                        <p className="text-3xl md:text-4xl lg:text-6xl font-light tracking-tighter leading-none text-orange-2">
                          {qualityStats.totalCompanies}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="tracking-tight text-base md:mb-2 font-bold">Genomsnittlig noggrannhet</p>
                      <div className="flex items-baseline gap-4">
                        <p className="text-3xl md:text-4xl lg:text-6xl font-light tracking-tighter leading-none text-orange-2">
                          {qualityStats.averageCorrectness}<span className="text-lg lg:text-2xl md:text-lg sm:text-sm ml-2 text-grey">%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Tabs */}
          <div className="bg-black-2 rounded-level-1 py-4 md:py-8">
            <div className="px-4 md:px-16">
              <div className="@container">
                <div className="flex flex-col @lg:flex-row @lg:items-center @lg:justify-between mb-6 @lg:mb-12 gap-4 @lg:gap-0">
                  <div className="space-y-2">
                    <p className="tracking-tight text-4xl font-light">Kvalitetsanalys</p>
                    <p className="tracking-tight text-base font-light text-grey">Noggrannhetsfördelning och felkategorier</p>
                  </div>
                  
                  <Tabs defaultValue="histogram" className="w-full @lg:w-auto">
                    <TabsList className="inline-flex h-9 items-center justify-center rounded-lg p-1 text-muted-foreground bg-black-1">
                      <TabsTrigger value="histogram" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                        Noggrannhetsanalys
                      </TabsTrigger>
                      <TabsTrigger value="errors" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow">
                        Felkategorier
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="histogram" className="mt-8 space-y-8">
                      {/* Histogram Chart */}
                      <div className="h-[300px] md:h-[400px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={qualityStats.correctnessHistogram}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--grey)" />
                              <XAxis 
                                dataKey="range" 
                                fontSize={12}
                                fill="var(--grey)"
                              />
                              <YAxis 
                                fontSize={12}
                                fill="var(--grey)"
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              {ERROR_CATEGORIES.map(category => (
                                <Bar 
                                  key={category.type}
                                  dataKey={category.type} 
                                  stackId="errors"
                                  fill={category.color}
                                  name={category.description}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>

                      {/* Error Statistics */}
                      <div className="bg-black-1 rounded-level-2 p-6">
                        <div className="space-y-2 mb-4">
                          <p className="tracking-tight text-xl font-light">Felstatistik</p>
                          <p className="tracking-tight text-sm font-light text-grey">Sammanfattning av alla felkategorier</p>
                        </div>
                        <div className="grid grid-cols-1 @md:grid-cols-2 gap-2 max-h-300px md:max-h-500px overflow-y-auto w-full pr-2">
                          {ERROR_CATEGORIES.map(category => (
                            <div key={category.type} className="flex items-center gap-2 p-2 rounded-md hover:bg-black-2/60 transition-colors">
                              <div 
                                className="w-3 h-3 rounded flex-shrink-0" 
                                style={{ backgroundColor: category.color }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-white">{category.description}</div>
                                <div className="text-xs text-grey flex justify-between">
                                  <span>{qualityStats.errorDistribution[category.type] || 0} fel</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="errors" className="mt-8">
                      <div className="h-[300px] md:h-[400px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={errorChartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                dataKey="count"
                                label={({ category, count }) => `${category}: ${count}`}
                              >
                                {errorChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}