import { cn } from '@/lib/utils';

interface StatusTimelineProps {
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'pending' | 'failed';
    description?: string;
  }>;
  className?: string;
}

export function StatusTimeline({
  steps,
  className
}: StatusTimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          {/* Status indicator */}
          <div className="h-3 w-3 rounded-full">
            {step.status === 'completed' && (
              <div className="bg-primary" />
            )}
            {step.status === 'current' && (
              <div className="bg-warning" />
            )}
            {step.status === 'pending' && (
              <div className="bg-muted-foreground/20" />
            )}
            {step.status === 'failed' && (
              <div className="bg-destructive" />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{step.label}</h3>
              {step.status === 'current' && (
                <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                  Sedang diproses
                </span>
              )}
            </div>
            {step.description && (
              <p className="text-xs text-muted-foreground">{step.description}</p>
            )}
          </div>

          {/* Connector line (except for last step) */}
          {index < steps.length - 1 && (
            <div className="h-0.5 w-4 flex-shrink-0">
              {step.status === 'completed' && (
                <div className="h-0.5 w-full bg-primary" />
              )}
              {step.status === 'current' && (
                <div className="h-0.5 w-full bg-warning" />
              )}
              {step.status === 'pending' && (
                <div className="h-0.5 w-full bg-muted-foreground/20" />
              )}
              {step.status === 'failed' && (
                <div className="h-0.5 w-full bg-destructive" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}