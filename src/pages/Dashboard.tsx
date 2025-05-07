import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, User, MessageSquare, Bell, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MessageSystem from '@/components/MessageSystem';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  email: string;
  name?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  password_hash: string;
}

interface SkillData {
  id: string;
  name: string;
  category: string;
}

interface UserSkill {
  id: string;
  type: 'teach' | 'learn';
  skill: SkillData;
}

interface MatchData {
  id: string;
  teacher_id: string;
  learner_id: string;
  teacher: UserData;
  learner: UserData;
  status: string;
}

interface MatchUser {
  id: string;
  name: string;
  skillOffered: string;
  skillRequested: string;
  matchPercentage: number;
}

interface Notification {
  id: string;
  type: 'match' | 'message' | 'profile_view';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

const skillCategories = [
  "Arts & Crafts",
  "Cooking & Baking",
  "Design",
  "Languages",
  "Music",
  "Programming & Technology",
  "Sports & Fitness",
  "Other"
];

const Dashboard = () => {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<MatchUser | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [skillsOffered, setSkillsOffered] = useState<SkillData[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<SkillData[]>([]);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [potentialCount, setPotentialCount] = useState<number>(0);
  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [isAddingOffered, setIsAddingOffered] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser) return;

      try {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) throw userError;
        if (userData && typeof userData === 'object') {
          const typedUserData = userData as UserData;
          setUserName(typedUserData.name || typedUserData.email?.split('@')[0] || 'User');

          // Calculate profile completion
          let completion = 0;
          if (typedUserData.location) completion += 25;
          if (typedUserData.bio) completion += 25;
          if (typedUserData.avatar_url) completion += 25;
          setProfileCompletion(completion);
        }

        // Fetch user skills
        const { data: skillsData, error: skillsError } = await supabase
          .from('user_skills')
          .select(`
            id,
            type,
            skill:skills (
              id,
              name,
              category
            )
          `)
          .eq('user_id', authUser.id);

        if (skillsError) throw skillsError;

        const typedSkillsData = skillsData as UserSkill[];
        const teachingSkills = typedSkillsData
          .filter(s => s.type === 'teach')
          .map(s => ({
            id: s.skill.id,
            name: s.skill.name,
            category: s.skill.category
          }));

        const learningSkills = typedSkillsData
          .filter(s => s.type === 'learn')
          .map(s => ({
            id: s.skill.id,
            name: s.skill.name,
            category: s.skill.category
          }));

        setSkillsOffered(teachingSkills);
        setSkillsWanted(learningSkills);

        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            teacher_id,
            learner_id,
            teacher:teacher_id (
              id,
              name,
              email
            ),
            learner:learner_id (
              id,
              name,
              email
            ),
            status
          `)
          .or(`teacher_id.eq.${authUser.id},learner_id.eq.${authUser.id}`)
          .eq('status', 'confirmed');

        if (matchesError) throw matchesError;

        const typedMatchesData = matchesData as MatchData[];
        const formattedMatches = typedMatchesData.map(match => {
          const otherUser = match.teacher_id === authUser.id ? match.learner : match.teacher;
          return {
            id: match.id,
            name: otherUser.name || otherUser.email.split('@')[0],
            skillOffered: match.teacher_id === authUser.id ? 'Your skill' : 'Their skill',
            skillRequested: match.teacher_id === authUser.id ? 'Their skill' : 'Your skill',
            matchPercentage: 85 // This should be calculated based on skill overlap
          };
        });

        setMatches(formattedMatches);

        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notificationsError) throw notificationsError;

        setNotifications(notificationsData.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          created_at: notification.created_at,
          read: notification.read
        })));

        // Fetch potential matches count
        const { data: potentialMatches, error: potentialError } = await supabase
          .from('users')
          .select('id')
          .neq('id', authUser.id);

        if (potentialError) throw potentialError;

        // Filter out users who are already matched
        const matchedUserIds = new Set([
          ...matchesData.map(m => m.teacher_id),
          ...matchesData.map(m => m.learner_id)
        ]);

        const potentialCount = potentialMatches.filter(u => !matchedUserIds.has(u.id)).length;
        setPotentialCount(potentialCount);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      }
    };

    fetchUserData();
  }, [authUser, toast]);

  const fetchSkills = async () => {
    if (!authUser) return;
    // Fetch user skills from DB
    const { data: skillsData, error: skillsError } = await supabase
      .from('user_skills')
      .select(`
        id,
        type,
        skill:skills (
          id,
          name,
          category
        )
      `)
      .eq('user_id', authUser.id);
    if (skillsError) throw skillsError;
    const typedSkillsData = skillsData as UserSkill[];
    const teachingSkills = typedSkillsData
      .filter(s => s.type === 'teach')
      .map(s => ({
        id: s.skill.id,
        name: s.skill.name,
        category: s.skill.category
      }));
    const learningSkills = typedSkillsData
      .filter(s => s.type === 'learn')
      .map(s => ({
        id: s.skill.id,
        name: s.skill.name,
        category: s.skill.category
      }));
    setSkillsOffered(teachingSkills);
    setSkillsWanted(learningSkills);
  };

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const skill = {
      id: isAddingOffered ? skillsOffered.length + 1 : skillsWanted.length + 1,
      name: newSkill.name,
      category: newSkill.category
    };

    if (isAddingOffered) {
      setSkillsOffered([...skillsOffered, skill]);
      toast({
        title: "Success!",
        description: `${skill.name} added to your offered skills.`,
      });
    } else {
      setSkillsWanted([...skillsWanted, skill]);
      toast({
        title: "Success!",
        description: `${skill.name} added to your wanted skills.`,
      });
    }

    // Reset form
    setNewSkill({ name: '', category: '' });
  };

  const handleRemoveSkill = (id: string, isOffered: boolean) => {
    if (isOffered) {
      setSkillsOffered(skillsOffered.filter(skill => skill.id !== id));
      toast({
        title: "Skill removed",
        description: "Skill has been removed from your offered skills.",
      });
    } else {
      setSkillsWanted(skillsWanted.filter(skill => skill.id !== id));
      toast({
        title: "Skill removed",
        description: "Skill has been removed from your wanted skills.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />

      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-lg p-6 mb-6 shadow-md">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {userName || 'User'}!</h1>
            <p>You have {potentialCount} potential skill matches waiting for you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills I Offer */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Skills I Offer</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary-dark"
                        onClick={() => setIsAddingOffered(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a skill you can teach</DialogTitle>
                        <DialogDescription>
                          Let others know what skills you can share with the community.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="skill-name">Skill name</Label>
                          <Input
                            id="skill-name"
                            value={newSkill.name}
                            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                            placeholder="e.g. JavaScript Programming"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {skillCategories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {skillsOffered.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 hover:bg-neutral rounded-lg mb-1">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{skill.category}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleRemoveSkill(skill.id, true)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Skills I Want */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Skills I Want to Learn</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-secondary hover:bg-secondary-dark"
                        onClick={() => setIsAddingOffered(false)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a skill you want to learn</DialogTitle>
                        <DialogDescription>
                          Let others know what skills you're interested in learning.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="skill-name">Skill name</Label>
                          <Input
                            id="skill-name"
                            value={newSkill.name}
                            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                            placeholder="e.g. Photography"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {skillCategories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {skillsWanted.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 hover:bg-neutral rounded-lg mb-1">
                      <div>
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{skill.category}</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleRemoveSkill(skill.id, false)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Matches Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{match.name}</h3>
                            <p className="text-sm text-gray-500">
                              Offers: {match.skillOffered} | Wants: {match.skillRequested}
                            </p>
                            <div className="flex items-center mt-1">
                              <Progress value={match.matchPercentage} className="w-24" />
                              <span className="ml-2 text-sm">{match.matchPercentage}% match</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedMatch(match);
                            setIsMessageDialogOpen(true);
                          }}
                          className="bg-primary hover:bg-primary-dark"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={profileCompletion} className="h-2" />
                    <p className="text-sm text-gray-500">{profileCompletion}% complete</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${userName ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span>Basic info added</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${skillsOffered.length > 0 || skillsWanted.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span>Skills added</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${profileCompletion >= 75 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span>Add a profile picture</span>
                      </li>
                      <li className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${profileCompletion === 100 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span>Set availability times</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  <Badge>{notifications.filter(n => !n.read).length} New</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-4 p-3 bg-neutral rounded-lg">
                        {notification.type === 'match' && <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {notification.type === 'message' && <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {notification.type === 'profile_view' && <Eye className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full justify-start" variant="outline" onClick={() => setIsAddingOffered(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a new skill</DialogTitle>
                        <DialogDescription>
                          Add a skill you can teach or want to learn.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="skill-name">Skill name</Label>
                          <Input
                            id="skill-name"
                            value={newSkill.name}
                            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                            placeholder="Enter skill name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {skillCategories.map((category) => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Link to="/matches">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" /> Check Messages
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button className="w-full justify-start" variant="outline">
                      <User className="mr-2 h-4 w-4" /> Update Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat with {selectedMatch?.name}</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <MessageSystem
              otherUserId={selectedMatch.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
