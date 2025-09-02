import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, BookOpen, MessageSquare, Clock, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AnalyticsData {
  overallProgress: number;
  totalUsers: number;
  activeChats: number;
  completedChapters: number;
  averageEngagement: number;
  weeklyActivity: Array<{ day: string; users: number; engagement: number }>;
  categoryProgress: Array<{ category: string; progress: number; users: number }>;
  topChapters: Array<{ title: string; completions: number; rating: number }>;
}

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return null;
    }
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Overall Progress",
      value: `${analytics?.overallProgress || 0}%`,
      icon: TrendingUp,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Users",
      value: analytics?.totalUsers || 0,
      icon: Users,
      change: "+3%",
      changeType: "positive" as const,
    },
    {
      title: "Completed Chapters",
      value: analytics?.completedChapters || 0,
      icon: BookOpen,
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "AI Conversations",
      value: analytics?.activeChats || 0,
      icon: MessageSquare,
      change: "+15%",
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-3 md:p-4 pb-20">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track engagement and progress across your organization
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 overflow-x-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Badge
                    variant={stat.changeType === "positive" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    vs last month
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8 overflow-x-auto">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Progress by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.categoryProgress?.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.category}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {category.users} users
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.progress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={category.progress} className="h-2" />
                  </div>
                )) || (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Top Performing Chapters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topChapters?.map((chapter, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {chapter.completions} completions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {chapter.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Activity */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 overflow-x-auto">
              {analytics?.weeklyActivity?.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {day.users} users
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {day.engagement}% engagement
                      </p>
                    </div>
                    <div className="w-24">
                      <Progress value={day.engagement} className="h-2" />
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No activity data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}