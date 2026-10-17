import { CheckCircle, Clock, Truck, XCircle, Package, Hand } from 'lucide-react';

interface TimelineItemProps {
  title: string;
  description?: string;
  timestamp: string; // ISO string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'donation' | 'order';
}

export function TimelineItem({ title, description, timestamp, status, type = 'donation' }: TimelineItemProps) {
  const date = new Date(timestamp);
  const timeString = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Status icon and color based on type and status
  let Icon: React.ElementType = Clock;
  let bgClass = 'bg-muted';
  let textClass = 'text-muted-foreground';

  if (type === 'donation') {
    switch (status) {
      case 'pending':
        Icon = Clock;
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-600';
        break;
      case 'in_progress':
        Icon = Hand;
        bgClass = 'bg-blue-50';
        textClass = 'text-blue-600';
        break;
      case 'completed':
        Icon = CheckCircle;
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-600';
        break;
      case 'cancelled':
        Icon = XCircle;
        bgClass = 'bg-red-50';
        textClass = 'text-red-600';
        break;
      default:
        Icon = Package;
        bgClass = 'bg-muted';
        textClass = 'text-muted-foreground';
    }
  } else if (type === 'order') {
    switch (status) {
      case 'pending':
        Icon = Clock;
        bgClass = 'bg-amber-50';
        textClass = 'text-amber-600';
        break;
      case 'in_progress':
        Icon = Truck;
        bgClass = 'bg-indigo-50';
        textClass = 'text-indigo-600';
        break;
      case 'completed':
        Icon = CheckCircle;
        bgClass = 'bg-emerald-50';
        textClass = 'text-emerald-600';
        break;
      case 'cancelled':
        Icon = XCircle;
        bgClass = 'bg-red-50';
        textClass = 'text-red-600';
        break;
      default:
        Icon = Package;
        bgClass = 'bg-muted';
        textClass = 'text-muted-foreground';
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-start space-x-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${bgClass}`}>
          <Icon className={`h-4 w-4 ${textClass}`} aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {dateString}, {timeString}
          </p>
        </div>
      </div>
    </div>
  );
}

interface TimelineProps {
  items: TimelineItemProps[];
  type?: 'donation' | 'order';
}

export function Timeline({ items, type = 'donation' }: TimelineProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="border-l-2 border-muted pl-4">
          <TimelineItem {...item} type={type} />
        </div>
      ))}
    </div>
  );
}