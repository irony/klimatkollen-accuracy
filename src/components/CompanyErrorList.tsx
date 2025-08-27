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
            {companiesWithError.slice(0, 10).map((company) => (
              <div key={company.companyId} className="flex items-center justify-between p-3 bg-black-2 rounded-md">
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
            ))}
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