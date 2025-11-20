import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersApi, teamsApi, invitationsApi } from "@/lib/api";
import { UserCard } from "@/components/UserCard";
import { Plus, Users, Mail, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";

export default function TeamManagement() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, teamsData, invitesData] = await Promise.all([
          usersApi.getAll(),
          teamsApi.getAll(),
          user?.role === "manager" ? invitationsApi.getAll(user.id) : Promise.resolve([])
        ]);
        
        // Get all member IDs from all teams
        const allTeamMemberIds = new Set<string>();
        teamsData.forEach((team: any) => {
          team.members.forEach((member: any) => {
            allTeamMemberIds.add(member.id || member._id || member);
          });
        });
        
        // Filter users who are in teams and not superadmin
        const membersInTeams = usersData.filter((u: any) => 
          u.role !== "superadmin" && allTeamMemberIds.has(u.id || u._id)
        );
        
        setTeamMembers(membersInTeams);
        setTeams(teamsData);
        setInvitations(invitesData);
      } catch (error) {
        toast.error("Failed to load team data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!["developer", "tester"].includes(inviteRole)) {
      toast.error("Role must be 'developer' or 'tester'");
      return;
    }

    setSendingInvite(true);
    try {
      await invitationsApi.send(inviteEmail, inviteRole, user!.id);
      
      // Refresh invitations list
      const invitesData = await invitationsApi.getAll(user!.id);
      setInvitations(invitesData);
      
      setInviteEmail("");
      setInviteRole("");
      setDialogOpen(false);
      toast.success("Invitation sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      // Find the team that contains this user
      const userTeam = teams.find(team => 
        team.members.some((member: any) => member.id === userId || member._id === userId)
      );

      if (!userTeam) {
        toast.error("User is not part of any team");
        return;
      }

      // Remove member from team
      await teamsApi.removeMember(userTeam.id, userId);
      
      // Reload data from backend to ensure consistency
      const [usersData, teamsData] = await Promise.all([
        usersApi.getAll(),
        teamsApi.getAll()
      ]);
      
      // Get all member IDs from all teams
      const allTeamMemberIds = new Set<string>();
      teamsData.forEach((team: any) => {
        team.members.forEach((member: any) => {
          allTeamMemberIds.add(member.id || member._id || member);
        });
      });
      
      // Filter users who are in teams and not superadmin
      const membersInTeams = usersData.filter((u: any) => 
        u.role !== "superadmin" && allTeamMemberIds.has(u.id || u._id)
      );
      
      setTeamMembers(membersInTeams);
      setTeams(teamsData);
      
      toast.success("Team member removed from team");
    } catch (error) {
      toast.error("Failed to remove member from team");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>

        {user?.role === "manager" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an email invitation to join your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="tester">Tester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSendInvitation} className="w-full" disabled={sendingInvite}>
                  {sendingInvite ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {user?.role === "manager" && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.filter((i: any) => i.status === "pending").length})
            </CardTitle>
            <CardDescription>Team invitations waiting for acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter((inv: any) => inv.status === "pending")
                .map((inv: any) => (
                  <div
                    key={inv.id || inv._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Role: <Badge variant="outline">{inv.role}</Badge>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              {invitations
                .filter((inv: any) => inv.status === "accepted")
                .map((inv: any) => (
                  <div
                    key={inv.id || inv._id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Role: <Badge variant="outline">{inv.role}</Badge>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Accepted
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>Current team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <UserCard
                key={member.id}
                user={member}
                onRemove={() => handleRemoveMember(member.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
