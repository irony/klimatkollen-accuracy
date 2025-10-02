import { CompanyComparison } from '@/types/data-quality';

interface YearErrorVisualizationProps {
  company: CompanyComparison;
}

export default function YearErrorVisualization({ company }: YearErrorVisualizationProps) {
  const details = company.comparisonDetails;
  
  // Extract years
  const stageYear = details.year.stage;
  const prodYear = details.year.prod;
  
  // Extract values that are the same but in different years
  const dataPoints = [
    { label: 'Scope 1', stage: details.scope1.stage, prod: details.scope1.prod },
    { label: 'Scope 2 (MB)', stage: details.scope2.stage, prod: details.scope2.prod },
    { label: 'Scope 3', stage: details.scope3.stage, prod: details.scope3.prod },
    { label: 'Omsättning', stage: details.revenue.stage, prod: details.revenue.prod },
    { label: 'Anställda', stage: details.employees.stage, prod: details.employees.prod },
  ];

  return (
    <div className="space-y-4 p-4 bg-black-1 rounded-lg border border-red-500/30">
      <div className="text-sm text-grey mb-4">
        Data från <span className="font-bold text-orange-2">{stageYear}</span> på stage verkar vara samma som data från <span className="font-bold text-green-500">{prodYear}</span> på prod
      </div>
      
      <div className="space-y-6">
        {dataPoints.map((point, index) => (
          <div key={index} className="relative">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Stage data (left) */}
              <div className="bg-black-2 p-3 rounded-lg border border-orange-2/50 text-right">
                <div className="text-xs text-grey mb-1">{point.label}</div>
                <div className="font-mono text-sm text-white">{point.stage}</div>
                <div className="text-xs text-orange-2 mt-1">År: {stageYear}</div>
              </div>
              
              {/* Connection line */}
              <div className="flex items-center justify-center px-2">
                <svg width="40" height="2" className="text-grey">
                  <line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                </svg>
              </div>
              
              {/* Prod data (right) */}
              <div className="bg-black-2 p-3 rounded-lg border border-green-500/50 text-left">
                <div className="text-xs text-grey mb-1">{point.label}</div>
                <div className="font-mono text-sm text-white">{point.prod}</div>
                <div className="text-xs text-green-500 mt-1">År: {prodYear}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs font-semibold pt-4 border-t border-grey/20">
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
}
