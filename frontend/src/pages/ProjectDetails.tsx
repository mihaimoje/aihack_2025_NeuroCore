import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { projectsApi, tasksApi, teamsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ExternalLink, GitBranch, GitPullRequest, AlertCircle, Users, Plus, X } from "lucide-react";
import { GithubActivityPanel } from "@/components/GithubActivityPanel";
import { TaskList } from "@/components/TaskList";
import { useAuth } from "@/contexts/AuthContext";
import NotFound from "./NotFound";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock GitHub activity for now
const mockGitHubActivity: any = {
  commits: 0,
  pullRequests: 0,
  issues: 0,
  lastCommit: "N/A",
  recentCommits: []
};

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [projectData, tasksData] = await Promise.all([
          projectsApi.getById(id),
          tasksApi.getAll({ projectId: id })
        ]);
        setProject(projectData);
        setProjectTasks(tasksData);

        // Fetch team members if user is manager
        if (user?.role === 'manager' && projectData.teamId) {
          const teamData = await teamsApi.getById(projectData.teamId._id || projectData.teamId);
          setTeamMembers(teamData.members || []);
        }
      } catch (error) {
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleAddMember = async () => {
    if (!selectedMember || !id) return;

    try {
      const updatedProject = await projectsApi.addMember(id, selectedMember);
      setProject(updatedProject);
      setSelectedMember("");
      setDialogOpen(false);
      toast.success("Member added successfully");
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;

    try {
      const updatedProject = await projectsApi.removeMember(id, memberId);
      setProject(updatedProject);
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  // Filter team members who are not already in the project
  const availableMembers = teamMembers.filter(
    member => !project?.members?.some((pm: any) =>
      (pm._id || pm.id || pm) === (member._id || member.id || member)
    )
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <NotFound />;
  }

  const completed = projectTasks.filter(t => t.status === "done").length;
  const inProgress = projectTasks.filter(t => t.status === "in-progress").length;
  const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0;
  const githubActivity = mockGitHubActivity;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <Button variant="outline" asChild>
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Overall completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {completed} of {projectTasks.length} tasks completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
              <CardDescription>All tasks for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={projectTasks} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {githubActivity && <GithubActivityPanel activity={githubActivity} />}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Members</CardTitle>
                  <CardDescription>Team members working on this project</CardDescription>
                </div>
                {user?.role === 'manager' && availableMembers.length > 0 && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Select a team member to add to this project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select value={selectedMember} onValueChange={setSelectedMember}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMembers.map((member) => (
                              <SelectItem key={member._id || member.id} value={member._id || member.id}>
                                {member.name} ({member.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddMember} className="w-full" disabled={!selectedMember}>
                          Add Member
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.members && project.members.length > 0 ? (
                  project.members.map((member: any) => (
                    <div key={member._id || member.id || member} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{member.role || 'Member'}</p>
                        </div>
                      </div>
                      {user?.role === 'manager' && member._id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member._id || member.id || member)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members assigned to this project
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
