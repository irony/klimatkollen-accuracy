import { useState } from 'react';
import { CompanyComparison, ErrorCategory } from '@/types/data-quality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface CompanyErrorListProps {
  errorCategory: ErrorCategory;
  companies: CompanyComparison[];
  environment?: 'stage' | 'prod';
}

export default function CompanyErrorList({ errorCategory, companies, environment = 'stage' }: CompanyErrorListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const companiesWithError = companies.filter(company => 
    company.errors.some(error => error.type === errorCategory.type)
  );

  const baseUrl = environment === 'stage' 
    ? 'https://stage.klimatkollen.se/sv/companies'
    : 'https://klimatkollen.se/sv/companies';

  return (
    <Card className="bg-black-1">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded flex-shrink-0" 
              style={{ backgroundColor: errorCategory.color }}
            />
            <span>{errorCategory.description}</span>
            <span className="text-sm text-grey">({companiesWithError.length} företag)</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-2">
            {companiesWithError.slice(0, 10).map((company) => {
              const getErrorDetails = (errorType: string) => {
                const details = company.comparisonDetails;
                const isCurrentError = (field: string) => {
                  return (
                    (errorType.includes('scope1') && field === 'scope1') ||
                    (errorType.includes('scope2') && field === 'scope2') ||
                    (errorType.includes('scope3') && field === 'scope3') ||
                    (errorType.includes('revenue') && field === 'revenue') ||
                    (errorType.includes('employees') && field === 'employees') ||
                    (errorType.includes('currency') && field === 'currency') ||
                    (errorType.includes('year') && field === 'year')
                  );
                };

                return (
                  <div className="space-y-3">
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('scope1') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.scope1.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Scope 1 --</span>
                      <span className="font-mono text-lg text-white">{details.scope1.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('scope2') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.scope2.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Scope 2 --</span>
                      <span className="font-mono text-lg text-white">{details.scope2.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('scope3') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.scope3.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Scope 3 --</span>
                      <span className="font-mono text-lg text-white">{details.scope3.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('revenue') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.revenue.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Omsättning --</span>
                      <span className="font-mono text-lg text-white">{details.revenue.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('employees') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.employees.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Anställda --</span>
                      <span className="font-mono text-lg text-white">{details.employees.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('currency') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.currency.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- Valuta --</span>
                      <span className="font-mono text-lg text-white">{details.currency.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-2 rounded ${isCurrentError('year') ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                      <span className="font-mono text-lg text-white">{details.year.stage ?? 'saknas'}</span>
                      <span className="text-sm text-grey font-medium">-- År --</span>
                      <span className="font-mono text-lg text-white">{details.year.prod ?? 'saknas'}</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-grey font-semibold pt-2 border-t border-grey/20">
                      <span>STAGE</span>
                      <span>PROD</span>
                    </div>
                  </div>
                );
              };

              const relevantError = company.errors.find(error => error.type === errorCategory.type);
              const errorDetail = relevantError ? getErrorDetails(relevantError.type) : null;

              return (
                <div key={company.companyId} className="p-3 bg-black-2 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{company.companyName}</h4>
                      <p className="text-sm text-grey">
                        Noggrannhet: {company.correctnessPercentage}% • 
                        {company.errors.length} fel totalt
                      </p>
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
                  {errorDetail && (
                    <div className="bg-black-1 p-4 rounded-lg border">
                      {errorDetail}
                    </div>
                  )}
                </div>
              );
            })}
            {companiesWithError.length > 10 && (
              <p className="text-sm text-grey text-center pt-2">
                Visar 10 av {companiesWithError.length} företag
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}