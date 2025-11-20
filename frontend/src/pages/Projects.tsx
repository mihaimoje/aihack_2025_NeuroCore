import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { projectsApi, tasksApi } from "@/lib/api";
import { Plus, FolderKanban, Users, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl: string;
  members: string[];
  createdAt: string;
}

interface Task {
  id: string;
  status: string;
  projectId: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    githubUrl: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [projectsData, tasksData] = await Promise.all([
          projectsApi.getUserProjects(user.id),
          tasksApi.getAll()
        ]);
        setProjects(projectsData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description) {
      toast.error("Please fill in required fields");
      return;
    }

    // Verifică dacă utilizatorul este manager
    if (user?.role !== "manager") {
      toast.error("Only managers can create projects");
      return;
    }

    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        githubLink: newProject.githubUrl || "https://github.com/company/project",
        userId: user.id, // Add user ID for team assignment
      };

      const createdProject = await projectsApi.create(projectData);

      // Refresh projects list
      const updatedProjects = await projectsApi.getUserProjects(user.id);
      setProjects(updatedProjects);

      setNewProject({ name: "", description: "", githubUrl: "" });
      setDialogOpen(false);
      toast.success("Project created successfully");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your team's projects</p>
        </div>

        {user?.role === "manager" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to your workspace
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    placeholder="E-commerce Platform"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="A modern e-commerce solution..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/company/project"
                    value={newProject.githubUrl}
                    onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const completed = projectTasks.filter(t => t.status === "done").length;
          const progress = projectTasks.length > 0 ? (completed / projectTasks.length) * 100 : 0;

          return (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FolderKanban className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="mt-2">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CheckSquare className="h-4 w-4" />
                        <span>{completed}/{projectTasks.length} tasks</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{project.members.length} members</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
