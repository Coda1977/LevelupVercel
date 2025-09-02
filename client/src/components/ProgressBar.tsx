interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-3 flex-1 rounded-full transition-all duration-300 ${
                i < current 
                  ? 'bg-[var(--accent-yellow)]' 
                  : i === current 
                    ? 'bg-[var(--text-primary)]' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xl font-bold text-[var(--text-primary)]">{percentage}%</span>
      </div>
    </div>
  );
}
