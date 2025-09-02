import { ArrowRight, CheckCircle, Clock } from "lucide-react";

interface CategoryCardProps {
  category: {
    id: number;
    slug: string;
    title: string;
    description: string;
    progress: number;
    total: number;
    lessons: any[];
    bookSummaries: any[];
  };
  onCategoryClick: (category: any) => void;
}

export function CategoryCard({ category, onCategoryClick }: CategoryCardProps) {
  const completionPercentage = Math.round((category.progress / (category.total || 1)) * 100);
  const isCompleted = category.progress === category.total;
  
  return (
    <div 
      className="bg-white p-8 md:p-12 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100"
      onClick={() => onCategoryClick(category)}
    >
      {/* Category Icon & Status */}
      <div className="flex items-start justify-between mb-6">
        <div className="w-16 h-16 bg-[var(--accent-blue)] rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-[var(--accent-yellow)] transition-colors duration-300">
          <span className="text-white text-2xl font-black group-hover:text-[var(--text-primary)]">
            {category.title.charAt(0)}
          </span>
        </div>
        
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Complete</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-gray-50 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">In Progress</span>
          </div>
        )}
      </div>

      {/* Category Info */}
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4 group-hover:text-[var(--accent-blue)] transition-colors duration-300">
        {category.title}
      </h3>
      
      <div 
        className="text-[var(--text-secondary)] mb-6 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: category.description }}
      />

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {category.progress} of {category.total} completed
          </span>
          <span className="text-lg font-bold text-[var(--accent-blue)]">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--accent-yellow)] to-[var(--accent-blue)] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Content Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <span className="text-lg">📖</span>
            <span>{category.lessons.length} Lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">📚</span>
            <span>{category.bookSummaries.length} Books</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm font-semibold text-[var(--text-secondary)]">
          {isCompleted ? 'Review Content' : 'Continue Learning'}
        </span>
        <ArrowRight className="w-5 h-5 text-[var(--accent-blue)] group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </div>
  );
}