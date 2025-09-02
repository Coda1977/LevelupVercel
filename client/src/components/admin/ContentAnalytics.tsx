import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Clock } from "lucide-react";

interface AnalyticsData {
  totalChapters: number;
  totalUsers: number;
  totalCompletions: number;
  avgTimeSpent: number;
  chapterStats: Array<{
    chapterId: number;
    title: string;
    completions: number;
    completionRate: number;
    avgTimeSpent: number;
  }>;
  popularChapters: Array<{
    chapterId: number;
    title: string;
    views: number;
    completions: number;
    rating: number;
  }>;
  engagementMetrics: {
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
    returnRate: number;
  };
}

interface ContentAnalyticsProps {
  analytics: AnalyticsData | null;
  isLoading: boolean;
}

export function ContentAnalytics({ analytics, isLoading }: ContentAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Content Analytics
          </CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Content Analytics
          </CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Content Analytics
        </CardTitle>
        <CardDescription>Insights into content performance and user engagement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Chapters</p>
                <p className="text-2xl font-bold text-blue-700">{analytics.totalChapters}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-green-700">{analytics.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Completions</p>
                <p className="text-2xl font-bold text-purple-700">{analytics.totalCompletions}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Avg Time Spent</p>
                <p className="text-2xl font-bold text-orange-700">{formatTime(analytics.avgTimeSpent)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{analytics.engagementMetrics.totalSessions}</p>
              <p className="text-sm text-gray-600">Total Sessions</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatTime(analytics.engagementMetrics.avgSessionDuration)}</p>
              <p className="text-sm text-gray-600">Avg Session Duration</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">{formatPercentage(analytics.engagementMetrics.bounceRate)}</p>
              <p className="text-sm text-gray-600">Bounce Rate</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{formatPercentage(analytics.engagementMetrics.returnRate)}</p>
              <p className="text-sm text-gray-600">Return Rate</p>
            </div>
          </div>
        </div>

        {/* Chapter Performance */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Chapter Performance</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analytics.chapterStats.map((chapter) => (
              <div key={chapter.chapterId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{chapter.title}</h4>
                  <p className="text-sm text-gray-600">
                    {chapter.completions} completions • {formatPercentage(chapter.completionRate)} completion rate
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatTime(chapter.avgTimeSpent)}</p>
                  <p className="text-xs text-gray-500">avg time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Content */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Most Popular Content</h3>
          <div className="space-y-3">
            {analytics.popularChapters.slice(0, 5).map((chapter, index) => (
              <div key={chapter.chapterId} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{chapter.title}</h4>
                  <p className="text-sm text-gray-600">
                    {chapter.views} views • {chapter.completions} completions
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(chapter.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">({chapter.rating.toFixed(1)})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Import BookOpen for the icon
import { BookOpen } from "lucide-react";