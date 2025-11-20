import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Mail, Shield, Github, Users, Calendar, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TeamMember {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: string;
}

interface Team {
    _id: string;
    name: string;
    managerId: TeamMember;
    members: TeamMember[];
    createdAt: string;
}

interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    team?: Team;
    githubUsername?: string;
    githubRepos?: string[];
    createdAt: string;
    updatedAt: string;
}

export default function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${user?.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'destructive';
            case 'manager':
                return 'default';
            case 'developer':
                return 'secondary';
            case 'tester':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Profile not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground mt-1">View and manage your account information</p>
                </div>
                <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your account details and role</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <User className="h-4 w-4 mr-2" />
                                    <span>Full Name</span>
                                </div>
                                <p className="text-lg font-medium">{profile.name}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <User className="h-4 w-4 mr-2" />
                                    <span>Username</span>
                                </div>
                                <p className="text-lg font-medium">@{profile.username}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4 mr-2" />
                                    <span>Email</span>
                                </div>
                                <p className="text-lg font-medium">{profile.email}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4 mr-2" />
                                    <span>Role</span>
                                </div>
                                <Badge variant={getRoleBadgeVariant(profile.role)} className="text-sm">
                                    {profile.role.toUpperCase()}
                                </Badge>
                            </div>

                            {profile.githubUsername && (
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Github className="h-4 w-4 mr-2" />
                                        <span>GitHub Username</span>
                                    </div>
                                    <p className="text-lg font-medium">
                                        <a
                                            href={`https://github.com/${profile.githubUsername}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            @{profile.githubUsername}
                                        </a>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    <span>Member Since</span>
                                </div>
                                <p className="text-lg font-medium">
                                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {profile.githubRepos && profile.githubRepos.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Github className="h-4 w-4 mr-2" />
                                        <span>GitHub Repositories</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.githubRepos.map((repo, index) => (
                                            <Badge key={index} variant="secondary">
                                                {repo}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Team Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Team
                        </CardTitle>
                        <CardDescription>Your team membership</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {profile.team ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Team Name</p>
                                    <p className="text-lg font-semibold">{profile.team.name}</p>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Manager</p>
                                    <div className="flex items-center space-x-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{profile.team.managerId.name}</p>
                                            <p className="text-xs text-muted-foreground">@{profile.team.managerId.username}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Team Members ({profile.team.members.length})
                                    </p>
                                    <div className="space-y-2">
                                        {profile.team.members.map((member) => (
                                            <div key={member._id} className="flex items-center space-x-2">
                                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                                                    <User className="h-3 w-3" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {member.role}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground">Not assigned to a team</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
