import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Search, 
  MoreHorizontal, 
  Crown, 
  User,
  TrendingUp,
  BookOpen,
  Clock
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member';
  joinedAt: string;
  lastActive: string;
  progress: {
    completedChapters: number;
    totalChapters: number;
    percentage: number;
  };
  engagement: {
    chatMessages: number;
    weeklyActivity: number;
  };
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  averageProgress: number;
  totalChaptersCompleted: number;
}

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: team, isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team/members"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("/api/team/invite", {
        method: "POST",
        body: { email }
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "Team invitation has been sent successfully",
      });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest(`/api/team/members/${memberId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "Team member has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    },
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

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  const filteredMembers = team?.filter(member => 
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (authLoading || teamLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-3 md:p-4 pb-20">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Team Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's Level Up team members and track their progress
          </p>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8 overflow-x-auto">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalMembers || 0}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.activeMembers || 0}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Progress
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.averageProgress || 0}%
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Completions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalChaptersCompleted || 0}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite Member */}
        <Card className="bg-white dark:bg-gray-800 mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Invite New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 md:p-6 mb-6 md:mb-8 overflow-x-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-gray-900 dark:text-white">
                Team Members
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No members found" : "No team members yet"}
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {member.firstName} {member.lastName}
                          </h3>
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {member.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Progress
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {member.progress.percentage}%
                          </Badge>
                        </div>
                        <div className="w-32">
                          <Progress value={member.progress.percentage} className="h-2" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {member.progress.completedChapters}/{member.progress.totalChapters} chapters
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {member.engagement.chatMessages} chats
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.engagement.weeklyActivity}% weekly activity
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last active: {new Date(member.lastActive).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removeMemberMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}