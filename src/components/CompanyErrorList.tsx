import { useState } from 'react';
import { CompanyComparison, ErrorCategory } from '@/types/data-quality';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface CompanyErrorListProps {
  errorCategory: ErrorCategory;
  companies: CompanyComparison[];
  environment?: 'stage' | 'prod';
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function CompanyErrorList({ errorCategory, companies, environment = 'stage', isExpanded: externalIsExpanded, onToggle }: CompanyErrorListProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  
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
        onClick={() => {
          if (onToggle) {
            onToggle();
          } else {
            setInternalIsExpanded(!internalIsExpanded);
          }
        }}
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
                const companyErrors = company.errors;
                
                const errorFields = [];
                
                // Only show fields that have errors for this company
                companyErrors.forEach(error => {
                  const isCurrentError = error.type === errorType;
                  
                  if (error.type.includes('scope1')) {
                    errorFields.push({
                      field: 'scope1',
                      label: '-- Scope 1 --',
                      stage: details.scope1.stage ?? 'saknas',
                      prod: details.scope1.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('scope2')) {
                    errorFields.push({
                      field: 'scope2', 
                      label: '-- Scope 2 --',
                      stage: details.scope2.stage ?? 'saknas',
                      prod: details.scope2.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('scope3')) {
                    errorFields.push({
                      field: 'scope3',
                      label: '-- Scope 3 --', 
                      stage: details.scope3.stage ?? 'saknas',
                      prod: details.scope3.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('revenue')) {
                    errorFields.push({
                      field: 'revenue',
                      label: '-- Omsättning --',
                      stage: details.revenue.stage ?? 'saknas',
                      prod: details.revenue.prod ?? 'saknas', 
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('employees')) {
                    errorFields.push({
                      field: 'employees',
                      label: '-- Anställda --',
                      stage: details.employees.stage ?? 'saknas',
                      prod: details.employees.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('currency')) {
                    errorFields.push({
                      field: 'currency',
                      label: '-- Valuta --',
                      stage: details.currency.stage ?? 'saknas',
                      prod: details.currency.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  } else if (error.type.includes('year')) {
                    errorFields.push({
                      field: 'year',
                      label: '-- År --',
                      stage: details.year.stage ?? 'saknas', 
                      prod: details.year.prod ?? 'saknas',
                      highlight: isCurrentError
                    });
                  }
                });

                // Remove duplicates based on field
                const uniqueErrorFields = errorFields.filter((field, index, self) => 
                  index === self.findIndex(f => f.field === field.field)
                );

                if (uniqueErrorFields.length === 0) return null;

                return (
                  <div className="space-y-3">
                    {uniqueErrorFields.map((errorField) => (
                      <div key={errorField.field} className={`flex justify-between items-center p-2 rounded ${errorField.highlight ? 'bg-red-500/20 border border-red-500/50' : 'bg-black-1/50'}`}>
                        <span className="font-mono text-lg text-white">{errorField.stage}</span>
                        <span className="text-sm text-grey font-medium">{errorField.label}</span>
                        <span className="font-mono text-lg text-white">{errorField.prod}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between text-xs font-semibold pt-2 border-t border-grey/20">
                      <a 
                        href={`https://stage.klimatkollen.se/sv/companies/${company.companyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-2 hover:text-blue-1 hover:underline"
                      >
                        STAGE
                      </a>
                      <a 
                        href={`https://klimatkollen.se/sv/companies/${company.companyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-2 hover:text-blue-1 hover:underline"
                      >
                        PROD
                      </a>
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