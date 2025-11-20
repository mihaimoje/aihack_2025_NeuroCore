import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface TeamMember {
  userId: string;
  name: string;
  email: string;
}

interface BurnoutHeatmapProps {
  score: number;
  dailyHours: Array<{ date: string; hours: number; dayOfWeek: string }>;
  teamMembers: TeamMember[];
  onUserChange: (userId: string | null) => void;
  selectedUserId?: string | null;
}

export const BurnoutHeatmap = ({ score, dailyHours, teamMembers, onUserChange, selectedUserId }: BurnoutHeatmapProps) => {
  const days = [ 'Sun','Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 4;

  // Convert dailyHours array into 4 weeks x 7 days grid
  const heatmapData = Array.from({ length: weeks }, (_, weekIndex) => {
    const weekData: number[] = [];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Calculate the actual day index in the dailyHours array (last 28 days)
      const dayOffset = (weeks - 1 - weekIndex) * 7 + dayIndex;
      const dailyData = dailyHours[dayOffset];
      weekData.push(dailyData?.hours || 0);
    }
    
    return weekData;
  });

  const getIntensityColor = (hours: number) => {
    if (hours < 6) return "bg-success/20";
    if (hours < 8) return "bg-success/50";
    if (hours < 10) return "bg-warning/50";
    if (hours < 12) return "bg-warning";
    return "bg-destructive";
  };

  const selectedMember = teamMembers.find(m => m.userId === selectedUserId);
  const displayName = selectedUserId ? selectedMember?.name : "All Team";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Heatmap</CardTitle>
            <CardDescription>Daily work hours over the past 4 weeks - {displayName}</CardDescription>
          </div>
          <Select
            value={selectedUserId || "all"}
            onValueChange={(value) => onUserChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="w-16"></div>
            {days.map((day) => (
              <div key={day} className="flex-1 text-center text-xs text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex gap-2">
              <div className="w-16 text-xs text-muted-foreground flex items-center">
                Week {weekIndex + 1}
              </div>
              {week.map((hours, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`flex-1 aspect-square rounded ${getIntensityColor(hours)} 
                    hover:ring-2 hover:ring-primary transition-all cursor-pointer
                    flex items-center justify-center text-xs font-medium`}
                  title={`${hours.toFixed(1)} hours`}
                >
                  {hours > 8 && <span className="text-foreground">{hours.toFixed(0)}</span>}
                </div>
              ))}
            </div>
          ))}

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-success/20"></div>
              <div className="w-4 h-4 rounded bg-success/50"></div>
              <div className="w-4 h-4 rounded bg-warning/50"></div>
              <div className="w-4 h-4 rounded bg-warning"></div>
              <div className="w-4 h-4 rounded bg-destructive"></div>
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
