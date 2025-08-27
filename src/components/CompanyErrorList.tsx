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
                switch (errorType) {
                  case 'scope1_major_error':
                  case 'scope1_minor_error':
                  case 'missing_scope1':
                    return `Scope 1: Stage ${details.scope1.stage ?? 'saknas'} vs Prod ${details.scope1.prod ?? 'saknas'}`;
                  case 'scope2_major_error':
                  case 'scope2_minor_error':
                  case 'missing_scope2':
                    return `Scope 2: Stage ${details.scope2.stage ?? 'saknas'} vs Prod ${details.scope2.prod ?? 'saknas'}`;
                  case 'scope3_major_error':
                  case 'scope3_minor_error':
                  case 'missing_scope3':
                    return `Scope 3: Stage ${details.scope3.stage ?? 'saknas'} vs Prod ${details.scope3.prod ?? 'saknas'}`;
                  case 'revenue_major_error':
                  case 'revenue_minor_error':
                  case 'missing_revenue':
                    return `Omsättning: Stage ${details.revenue.stage ?? 'saknas'} vs Prod ${details.revenue.prod ?? 'saknas'}`;
                  case 'employees_major_error':
                  case 'employees_minor_error':
                  case 'missing_employees':
                    return `Anställda: Stage ${details.employees.stage ?? 'saknas'} vs Prod ${details.employees.prod ?? 'saknas'}`;
                  case 'currency_error':
                    return `Valuta: Stage ${details.currency.stage ?? 'saknas'} vs Prod ${details.currency.prod ?? 'saknas'}`;
                  case 'year_mismatch':
                    return `År: Stage ${details.year.stage ?? 'saknas'} vs Prod ${details.year.prod ?? 'saknas'}`;
                  default:
                    return null;
                }
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
                    <div className="text-sm font-mono text-white bg-black-1 p-3 rounded border-l-2 border-red-500">
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