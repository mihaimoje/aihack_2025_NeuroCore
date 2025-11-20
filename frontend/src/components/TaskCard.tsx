import { Task } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { tasksApi } from "@/lib/api";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onStatusChange?: () => void;
}

export const TaskCard = ({ task, onStatusChange }: TaskCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "success";
      case "in-progress": return "default";
      case "review": return "warning";
      default: return "secondary";
    }
  };

  const getBorderColor = (priority: string, status: string) => {
    if (status === "done") return "border-l-success";
    switch (priority) {
      case "high": return "border-l-destructive";
      case "medium": return "border-l-primary";
      default: return "border-l-muted-foreground/30";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "done";

  const getTimeInfo = () => {
    // Estimated time (always show)
    const estimated = task.estimatedHours || 0;

    // Time elapsed since started (if in-progress)
    if (task.status === "in-progress" && task.startedAt) {
      const startDate = new Date(task.startedAt);
      const now = new Date();
      const elapsedMs = now.getTime() - startDate.getTime();
      const elapsedHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;
      return `${elapsedHours}h / ${estimated}h (in progress)`;
    }

    // Actual time (if done)
    if (task.status === "done") {
      const actual = task.actualHours || 0;
      return `${actual}h / ${estimated}h (completed)`;
    }

    // Just estimated (if todo)
    return `${estimated}h (estimated)`;
  };

  return (
    <Card className={`hover:shadow-md transition-shadow border-l-4 ${getBorderColor(task.priority, task.status)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/tasks/${task.id}`} className="flex-1">
            <h4 className="font-medium hover:underline">{task.title}</h4>
          </Link>
          <div className="flex gap-2 ml-2">
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Select
              value={task.status}
              onValueChange={handleStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[130px] h-6 text-xs">
                <SelectValue>
                  <Badge variant={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Link to={`/tasks/${task.id}`}>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{getTimeInfo()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className={`h-3 w-3 ${isOverdue ? "text-destructive" : ""}`} />
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
