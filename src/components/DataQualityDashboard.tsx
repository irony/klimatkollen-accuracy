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
  const [stageData, setStageData] = useState<Company[]>([]);
  const [prodData, setProdData] = useState<Company[]>([]);
  const [comparisons, setComparisons] = useState<CompanyComparison[]>([]);
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [stageResponse, prodResponse] = await Promise.all([
        fetch('https://stage-api.klimatkollen.se/api/companies'),
        fetch('https://api.klimatkollen.se/api/companies'),
      ]);

      if (!stageResponse.ok || !prodResponse.ok) {
        throw new Error('Failed to fetch data from APIs');
      }

      const stageCompanies: Company[] = await stageResponse.json();
      const prodCompanies: Company[] = await prodResponse.json();

      setStageData(stageCompanies);
      setProdData(prodCompanies);

      // Jämför företagen
      const comparisonResults: CompanyComparison[] = [];
      stageCompanies.forEach(stageCompany => {
        const prodCompany = prodCompanies.find(p => p.id === stageCompany.id);
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

  if (loading) {
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
    count: {
      label: "Antal företag",
      color: "hsl(var(--primary))",
    },
  };

  const errorChartData = ERROR_CATEGORIES.map(category => ({
    category: category.description,
    count: qualityStats.errorDistribution[category.type] || 0,
    color: category.color,
  }));

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Datakvalitetsanalys</h1>
        <p className="text-xl text-muted-foreground">
          Pipeline-kvalitet för hållbarhetsrapporter
        </p>
        <div className="flex justify-center gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">{qualityStats.totalCompanies}</div>
            <div className="text-sm text-muted-foreground">Analyserade företag</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">{qualityStats.averageCorrectness}%</div>
            <div className="text-sm text-muted-foreground">Genomsnittlig noggrannhet</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="histogram" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="histogram">Noggrannhetshistogram</TabsTrigger>
          <TabsTrigger value="errors">Felkategorier</TabsTrigger>
          <TabsTrigger value="companies">Företagsdetaljer</TabsTrigger>
        </TabsList>

        <TabsContent value="histogram">
          <Card>
            <CardHeader>
              <CardTitle>Fördelning av noggrannhet</CardTitle>
              <CardDescription>
                Antal företag per noggrannhetsnivå (5% intervaller)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityStats.correctnessHistogram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Felkategorier</CardTitle>
                <CardDescription>Antal företag per felkategori</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Felstatistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ERROR_CATEGORIES.map(category => (
                  <div key={category.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm">{category.description}</span>
                    </div>
                    <Badge variant="outline">
                      {qualityStats.errorDistribution[category.type] || 0} fel
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Företagsdetaljer</CardTitle>
              <CardDescription>
                Detaljerad lista över alla företag och deras fel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {comparisons
                  .sort((a, b) => a.correctnessPercentage - b.correctnessPercentage)
                  .map(comparison => (
                    <div 
                      key={comparison.companyId} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{comparison.companyName}</h4>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {comparison.errors.map((error, index) => (
                            <Badge 
                              key={index}
                              variant="outline"
                              style={{ 
                                borderColor: error.color,
                                color: error.color 
                              }}
                            >
                              {error.description}
                            </Badge>
                          ))}
                          {comparison.errors.length === 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Inga fel
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {comparison.correctnessPercentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">noggrannhet</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}