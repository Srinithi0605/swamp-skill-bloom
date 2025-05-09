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
import { Plus, MoreHorizontal, User, MessageSquare, Bell } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSkills } from '@/contexts/UserSkillsContext';

interface Skill {
  id: string;
  name: string;
  category: string;
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
  type: 'message' | 'match' | 'profile';
  title: string;
  timestamp: string;
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
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const { skillsOffered, skillsWanted, handleAddSkill, handleDeleteSkill } = useUserSkills();
  const [selectedMatch, setSelectedMatch] = useState<MatchUser | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: skillCategories[0] });
  const [isAddingOffered, setIsAddingOffered] = useState(false);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState<string>('');

  // Fetch user data including name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!authUser) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        setUserName(data?.name || authUser.email?.split('@')[0] || 'User');
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName(authUser.email?.split('@')[0] || 'User');
      }
    };

    fetchUserName();
  }, [authUser]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch recent messages
        const { data: messages, error: messageError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            message,
            timestamp,
            users!messages_sender_id_fkey (
              email
            )
          `)
          .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
          .order('timestamp', { ascending: false })
          .limit(3);

        if (messageError) throw messageError;

        // Transform messages into notifications
        const messageNotifications = (messages || []).map((msg: any) => ({
          id: msg.id,
          type: 'message' as const,
          title: msg.sender_id === authUser.id 
            ? `Message sent to ${msg.users?.email?.split('@')[0] || 'Unknown User'}`
            : `Message from ${msg.users?.email?.split('@')[0] || 'Unknown User'}`,
          timestamp: msg.timestamp
        }));

        setNotifications(messageNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast({
          title: "Error",
          description: "Failed to load notifications. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${authUser?.id}`
        },
        (payload) => {
          const newMessage = payload.new;
          setNotifications(prev => [{
            id: newMessage.id,
            type: 'message' as const,
            title: `New message from ${newMessage.sender_id}`,
            timestamp: newMessage.timestamp
          }, ...prev].slice(0, 3));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [authUser, toast]);

  // Fetch potential matches
  const fetchMatches = async () => {
    if (!authUser || skillsOffered.length === 0 || skillsWanted.length === 0) return;

    try {
      // Fetch users who want skills that the current user offers
      const { data: potentialMatches, error: matchError } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          type,
          skills (
            id,
            name
          ),
          users (
            id,
            email
          )
        `)
        .in('skill_id', skillsOffered.map(skill => skill.id))
        .eq('type', 'wanted')
        .neq('user_id', authUser.id);

      if (matchError) throw matchError;

      // Fetch users who offer skills that the current user wants
      const { data: offeredMatches, error: offeredError } = await supabase
        .from('user_skills')
        .select(`
          user_id,
          type,
          skills (
            id,
            name
          ),
          users (
            id,
            email
          )
        `)
        .in('skill_id', skillsWanted.map(skill => skill.id))
        .eq('type', 'offered')
        .neq('user_id', authUser.id);

      if (offeredError) throw offeredError;

      // Combine and transform the data into the MatchUser format
      const transformedMatches = (potentialMatches || []).map((match: any) => {
        const offeredSkill = (offeredMatches || []).find(
          (offered: any) => offered.user_id === match.user_id
        );

        return {
          id: match.user_id,
          name: match.users?.email?.split('@')[0] || 'Unknown User',
          skillOffered: offeredSkill?.skills?.name || 'Unknown Skill',
          skillRequested: match.skills?.name || 'Unknown Skill',
        };
      });

      // Calculate match percentage and add it to each match
      const transformedMatchesWithPercentage = transformedMatches.map(match => ({
        ...match,
        matchPercentage: 100 // For now hardcoded to 100%, can be calculated based on skill matching logic
      }));

      setMatches(transformedMatchesWithPercentage);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load potential matches. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (skillsOffered.length > 0 && skillsWanted.length > 0 && authUser) {
      fetchMatches();
    }
  }, [authUser, skillsOffered, skillsWanted, toast]);

  const handleAddNewSkill = async () => {
    const success = await handleAddSkill({
      name: newSkill.name,
      category: newSkill.category,
      type: isAddingOffered ? 'offered' : 'wanted'
    });

    if (success) {
      setNewSkill({ name: '', category: skillCategories[0] });
    }
  };

  const handleRemoveSkill = async (id: string, isOffered: boolean) => {
    await handleDeleteSkill(id, isOffered ? 'offered' : 'wanted');
  };

  if (isAuthLoading || isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!authUser) {
    return <div className="flex justify-center items-center h-screen">Please sign in to view the dashboard</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral dark:bg-gray-900">
      <NavBar />

      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary to-primary-light text-white rounded-lg p-6 mb-6 shadow-md">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h1>
            <p>You have {matches.length} potential skill matches waiting for you.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills I Offer */}
              <Card className="dark:bg-[#0a101a] dark:border-gray-700">
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
                      <div className="space-y-4">
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
                        <Button onClick={handleAddNewSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {skillsOffered.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 hover:bg-neutral dark:hover:bg-gray-700 rounded-lg mb-1">
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
              <Card className="dark:bg-[#0a101a] dark:border-gray-700">
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
                      <div className="space-y-4">
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
                        <Button onClick={handleAddNewSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {skillsWanted.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-3 hover:bg-neutral dark:hover:bg-gray-700 rounded-lg mb-1">
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
              {/* Notifications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Notifications</CardTitle>
                  <Badge>{notifications.length} New</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-4 p-3 bg-neutral rounded-lg dark:bg-gray-800 dark:text-white">
                        {notification.type === 'message' && <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {notification.type === 'match' && <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        {notification.type === 'profile' && <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-gray-500">
                            {notification.timestamp ? new Date(notification.timestamp).toLocaleDateString() : 'Unknown Date'}
                          </p>
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
                        <Button onClick={handleAddNewSkill}>Add Skill</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Link to="/matches">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" /> Check Matches
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