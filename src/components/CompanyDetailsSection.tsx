import { useState } from 'react';
import { CompanyComparison } from '@/types/data-quality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search } from 'lucide-react';

interface CompanyDetailsSectionProps {
  comparisons: CompanyComparison[];
  environment?: 'stage' | 'prod';
}

export default function CompanyDetailsSection({ comparisons, environment = 'stage' }: CompanyDetailsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'accuracy' | 'errors'>('errors');

  const baseUrl = environment === 'stage' 
    ? 'https://stage.klimatkollen.se/sv/companies'
    : 'https://klimatkollen.se/sv/companies';

  const filteredAndSortedCompanies = comparisons
    .filter(company => 
      company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'accuracy':
          return b.correctnessPercentage - a.correctnessPercentage;
        case 'errors':
        default:
          return b.errors.length - a.errors.length;
      }
    });

  const getAccuracyColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-2';
    if (percentage >= 70) return 'text-orange-2';
    return 'text-pink-3';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-2xl font-light tracking-tight">Alla företag</h3>
          <p className="text-base font-light text-grey">Detaljerad felanalys per företag</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey w-4 h-4" />
            <Input
              placeholder="Sök företag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black-1 border-grey/20"
            />
          </div>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'accuracy' | 'errors')}
            className="px-3 py-2 bg-black-1 border border-grey/20 rounded-md text-sm"
          >
            <option value="errors">Sortera efter fel</option>
            <option value="accuracy">Sortera efter noggrannhet</option>
            <option value="name">Sortera efter namn</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedCompanies.slice(0, 50).map((company) => (
          <Card key={company.companyId} className="bg-black-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{company.companyName}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`text-sm font-medium ${getAccuracyColor(company.correctnessPercentage)}`}>
                      Noggrannhet: {company.correctnessPercentage}%
                    </span>
                    <span className="text-sm text-grey">
                      {company.errors.length} fel totalt
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  asChild
                  className="text-blue-2 hover:text-blue-1"
                >
                  <a 
                    href={`${baseUrl}/${company.companyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Visa företag
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            
            {company.errors.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-grey mb-3">Identifierade fel:</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.errors.map((error, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className="text-xs"
                        style={{ 
                          borderColor: error.color,
                          color: error.color,
                          backgroundColor: `${error.color}10`
                        }}
                      >
                        {error.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {filteredAndSortedCompanies.length > 50 && (
          <Card className="bg-black-2">
            <CardContent className="text-center py-6">
              <p className="text-grey">
                Visar 50 av {filteredAndSortedCompanies.length} företag. 
                Använd sökfunktionen för att hitta specifika företag.
              </p>
            </CardContent>
          </Card>
        )}
        
        {filteredAndSortedCompanies.length === 0 && searchTerm && (
          <Card className="bg-black-2">
            <CardContent className="text-center py-6">
              <p className="text-grey">
                Inga företag hittades för "{searchTerm}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}