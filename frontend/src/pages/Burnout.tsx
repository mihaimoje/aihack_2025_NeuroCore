import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { BurnoutHeatmap } from "@/components/BurnoutHeatmap";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { burnoutApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Burnout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamBurnoutData, setTeamBurnoutData] = useState<any>(null);
  const [teamHours, setTeamHours] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingHours, setLoadingHours] = useState(false);

  const fetchTeamBurnout = async (forceRefresh = false) => {
    if (!user?.id) return;
    
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [burnoutData, hoursData] = await Promise.all([
        burnoutApi.getTeamBurnout(user.id, forceRefresh),
        burnoutApi.getTeamHours(user.id)
      ]);
      
      setTeamBurnoutData(burnoutData);
      setTeamHours(hoursData);
      
      if (forceRefresh) {
        toast({
          title: "Success",
          description: "Team burnout data refreshed successfully",
        });
      }
    } catch (error) {
      console.error('Error fetching team burnout:', error);
      toast({
        title: "Error",
        description: "Failed to load team burnout data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUserChange = async (userId: string | null) => {
    if (!user?.id) return;
    
    setSelectedUserId(userId);
    setLoadingHours(true);
    
    try {
      const hoursData = await burnoutApi.getTeamHours(user.id, userId || undefined);
      setTeamHours(hoursData);
    } catch (error) {
      console.error('Error fetching user hours:', error);
      toast({
        title: "Error",
        description: "Failed to load user activity data",
        variant: "destructive",
      });
    } finally {
      setLoadingHours(false);
    }
  };

  useEffect(() => {
    fetchTeamBurnout();
  }, [user?.id]);

  const getBurnoutLevel = (score: number) => {
    if (score < 40) return { level: "Low", color: "success", icon: CheckCircle2 };
    if (score < 70) return { level: "Moderate", color: "warning", icon: AlertTriangle };
    return { level: "High", color: "destructive", icon: AlertTriangle };
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    if (riskLevel === 'high') return 'destructive';
    if (riskLevel === 'medium') return 'default';
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading team burnout analysis...</div>
      </div>
    );
  }

  if (!teamBurnoutData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No team burnout data available</div>
      </div>
    );
  }

  const burnoutLevel = getBurnoutLevel(teamBurnoutData.averageScore || 0);
  const BurnoutIcon = burnoutLevel.icon;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Burnout Analysis</h1>
          <p className="text-muted-foreground mt-1">Monitor your team's workload and well-being</p>
        </div>
        <Button 
          onClick={() => fetchTeamBurnout(true)} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <Alert variant={burnoutLevel.color === "destructive" ? "destructive" : "default"}>
        <BurnoutIcon className="h-4 w-4" />
        <AlertTitle>Team Burnout Level: {burnoutLevel.level}</AlertTitle>
        <AlertDescription>
          Your team's average burnout score is {teamBurnoutData.averageScore}/100. 
          {burnoutLevel.color === "destructive" && " High risk detected - consider redistributing workload."}
          {burnoutLevel.color === "warning" && " Monitor team workload carefully."}
          {burnoutLevel.color === "success" && " Team is maintaining a healthy work-life balance!"}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avg Burnout Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{teamBurnoutData.averageScore}/100</div>
            <Progress 
              value={teamBurnoutData.averageScore} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {burnoutLevel.level} risk level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{teamBurnoutData.teamSize}</div>
            <p className="text-xs text-muted-foreground">
              Total members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-destructive">
              {teamBurnoutData.riskDistribution.high}
            </div>
            <p className="text-xs text-muted-foreground">
              Members at high risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Medium Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {teamBurnoutData.riskDistribution.medium}
            </div>
            <p className="text-xs text-muted-foreground">
              Members at medium risk
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Individual burnout scores and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamBurnoutData.members.map((member: any) => (
              <div key={member.userId} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    {member.githubUsername && (
                      <p className="text-xs text-muted-foreground mt-1">
                        GitHub: {member.githubUsername}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskBadgeVariant(member.riskLevel)}>
                      {member.riskLevel?.toUpperCase()}
                    </Badge>
                    <div className="text-2xl font-bold">{member.score}</div>
                  </div>
                </div>
                
                <Progress value={member.score} className="h-2" />
                
                {member.factors && (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Commits:</span>
                      <span className="font-medium ml-2">{member.factors.commitsCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="font-medium ml-2">{member.factors.tasksInProgress || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium ml-2">{member.factors.completedTasks || 0}</span>
                    </div>
                  </div>
                )}
                
                {member.analysis && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{member.analysis}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {teamHours && teamHours.dailyHours && teamBurnoutData?.members && (
        <BurnoutHeatmap 
          score={teamBurnoutData.averageScore} 
          dailyHours={teamHours.dailyHours}
          teamMembers={teamBurnoutData.members}
          onUserChange={handleUserChange}
          selectedUserId={selectedUserId}
        />
      )}
    </div>
  );
}
