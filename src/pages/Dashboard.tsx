
import { useState } from 'react';
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

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface MatchUser {
  id: number;
  name: string;
  skillOffered: string;
  skillRequested: string;
  matchPercentage: number;
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
  // Sample data for demonstration
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>([
    { id: 1, name: 'JavaScript Programming', category: 'Technology' },
    { id: 2, name: 'French Language', category: 'Languages' },
    { id: 3, name: 'Guitar', category: 'Music' },
  ]);

  const [skillsWanted, setSkillsWanted] = useState<Skill[]>([
    { id: 1, name: 'Photography', category: 'Arts' },
    { id: 2, name: 'Cooking', category: 'Food' },
  ]);

  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [isAddingOffered, setIsAddingOffered] = useState(false);

  const matches: MatchUser[] = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      skillOffered: 'Photography', 
      skillRequested: 'JavaScript Programming',
      matchPercentage: 92 
    },
    { 
      id: 2, 
      name: 'Sam Rivera', 
      skillOffered: 'Cooking', 
      skillRequested: 'French Language',
      matchPercentage: 85 
    },
  ];

  // Profile completion calculation
  const profileCompletion = 70; // percentage

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

  const handleRemoveSkill = (id: number, isOffered: boolean) => {
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
            <h1 className="text-2xl font-bold mb-2">Welcome back, User!</h1>
            <p>You have {matches.length} potential skill matches waiting for you.</p>
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
                            onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                            placeholder="e.g. JavaScript Programming"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({...newSkill, category: value})}
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
                            onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                            placeholder="e.g. Photography"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({...newSkill, category: value})}
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
              
              {/* Recent Matches */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg mb-3 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-center">
                        <div className="bg-swamp h-10 w-10 rounded-full flex items-center justify-center text-white mr-4">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">{match.name}</h4>
                          <p className="text-sm text-gray-500">
                            Offers: <span className="text-primary">{match.skillOffered}</span> • 
                            Wants: <span className="text-secondary">{match.skillRequested}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium bg-green-100 text-green-800 py-1 px-2 rounded-full">
                          {match.matchPercentage}% Match
                        </span>
                        <Link to="/matches">
                          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                            <MessageSquare className="h-4 w-4 mr-2" /> Message
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
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
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span>Basic info added</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        <span>Skills added</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        <span>Add a profile picture</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2"></span>
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
                  <Badge>3 New</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-3 bg-neutral rounded-lg">
                      <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">New skill match found!</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 p-3 bg-neutral rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Message from Alex Johnson</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 p-3 bg-neutral rounded-lg">
                      <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Profile view from Sam Rivera</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
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
                            onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                            placeholder="Enter skill name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newSkill.category}
                            onValueChange={(value) => setNewSkill({...newSkill, category: value})}
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
    </div>
  );
};

export default Dashboard;
