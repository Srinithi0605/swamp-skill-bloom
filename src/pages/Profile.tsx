import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Calendar, MapPin, Clock, Plus, Trash2, Star, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Skill {
  id: string;
  name: string;
  category: string;
  type: 'teach' | 'learn';
}

interface AvailabilitySlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Review {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  skill: string;
}

interface UserProfile {
  id: string;
  email: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

const Profile = () => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>([]);
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    bio: '',
    email: ''
  });

  // New state for dialogs
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day: '',
    start_time: '',
    end_time: ''
  });
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    type: 'teach' as 'teach' | 'learn'
  });
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    if (authUser) {
      fetchUserProfile();
    }
  }, [authUser]);

  const fetchUserProfile = async () => {
    if (!authUser) return;

    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setFormData({
        location: userData.location || '',
        bio: userData.bio || '',
        email: userData.email
      });

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

      const teachingSkills = skillsData
        .filter(s => s.type === 'teach')
        .map(s => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category,
          type: 'teach' as const
        }));

      const learningSkills = skillsData
        .filter(s => s.type === 'learn')
        .map(s => ({
          id: s.skill.id,
          name: s.skill.name,
          category: s.skill.category,
          type: 'learn' as const
        }));

      setSkillsOffered(teachingSkills);
      setSkillsWanted(learningSkills);

      // Fetch availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('user_availability')
        .select('*')
        .eq('user_id', authUser.id);

      if (availabilityError) throw availabilityError;
      setAvailability(availabilityData || []);

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          location: formData.location,
          bio: formData.bio
        })
        .eq('id', authUser.id);

      if (error) throw error;

      setUser(prev => prev ? {
        ...prev,
        location: formData.location,
        bio: formData.bio
      } : null);

    setEditing(false);
    toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleAddAvailability = async () => {
    if (!authUser || !newAvailability.day || !newAvailability.start_time || !newAvailability.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all availability fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_availability')
        .insert({
          user_id: authUser.id,
          day: newAvailability.day,
          start_time: newAvailability.start_time,
          end_time: newAvailability.end_time
        })
        .select()
        .single();

      if (error) throw error;

      setAvailability(prev => [...prev, data]);
      setShowAvailabilityDialog(false);
      setNewAvailability({ day: '', start_time: '', end_time: '' });
      toast({
        title: "Success",
        description: "Availability slot added successfully"
      });
    } catch (error) {
      console.error('Error adding availability:', error);
      toast({
        title: "Error",
        description: "Failed to add availability slot",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvailability(prev => prev.filter(slot => slot.id !== id));
      toast({
        title: "Success",
        description: "Availability slot removed"
      });
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: "Error",
        description: "Failed to remove availability slot",
        variant: "destructive"
      });
    }
  };

  const handleAddSkill = async () => {
    if (!authUser || !newSkill.name || !newSkill.category) {
      toast({
        title: "Error",
        description: "Please fill in all skill fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, check if skill exists
      let { data: existingSkill, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .eq('name', newSkill.name)
        .single();

      if (skillError && skillError.code !== 'PGRST116') {
        throw skillError;
      }

      let skillId;
      if (!existingSkill) {
        // Create new skill if it doesn't exist
        const { data: newSkillData, error: createError } = await supabase
          .from('skills')
          .insert({
            name: newSkill.name,
            category: newSkill.category
          })
          .select()
          .single();

        if (createError) throw createError;
        skillId = newSkillData.id;
      } else {
        skillId = existingSkill.id;
      }

      // Add skill to user_skills
      const { error: userSkillError } = await supabase
        .from('user_skills')
        .insert({
          user_id: authUser.id,
          skill_id: skillId,
          type: newSkill.type
        });

      if (userSkillError) throw userSkillError;

      // Refresh skills list
      await fetchUserProfile();
      setShowAddSkillDialog(false);
      setNewSkill({ name: '', category: '', type: 'teach' });
      toast({
        title: "Success",
        description: "Skill added successfully"
      });
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSkill = async (skillId: string, type: 'teach' | 'learn') => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', authUser?.id)
        .eq('skill_id', skillId)
        .eq('type', type);

      if (error) throw error;

      if (type === 'teach') {
        setSkillsOffered(prev => prev.filter(skill => skill.id !== skillId));
      } else {
        setSkillsWanted(prev => prev.filter(skill => skill.id !== skillId));
      }

      toast({
        title: "Success",
        description: "Skill removed successfully"
      });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral">
        <NavBar />
        <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-gray-500">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-neutral">
        <NavBar />
        <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-gray-500">Profile not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />
      
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
            <div className="relative px-6 pb-6">
              <Avatar className="absolute -top-12 border-4 border-white w-24 h-24">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="bg-swamp text-white text-xl">
                  {user.email.split('@')[0].slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="ml-28 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-swamp">{user.email.split('@')[0]}</h1>
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{user.location || 'No location set'}</span>
                  </div>
                </div>
                <Button 
                  className="mt-4 sm:mt-0 bg-primary hover:bg-primary-dark"
                  onClick={() => setEditing(!editing)}
                >
                  <Edit className="h-4 w-4 mr-2" /> {editing ? 'Cancel Editing' : 'Edit Profile'}
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-1 space-y-6">
              {/* Profile Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email"
                          value={formData.email}
                          disabled
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          name="location" 
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City, Country"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          name="bio" 
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={4}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        className="w-full bg-primary hover:bg-primary-dark"
                        onClick={handleSaveProfile}
                      >
                        Save Profile
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                        <p>{user.email}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                        <p className="text-sm text-gray-700">{user.bio || 'No bio added yet'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Availability */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Availability</CardTitle>
                  {!editing && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary-dark"
                      onClick={() => setShowAvailabilityDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availability.length > 0 ? (
                      availability.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium">{slot.day}</span>
                      </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {slot.start_time} - {slot.end_time}
                            {!editing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleDeleteAvailability(slot.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                      </div>
                    </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No availability set</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Skills Tabs */}
              <Card>
                <Tabs defaultValue="offered">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Skills</CardTitle>
                      {!editing && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary-dark"
                          onClick={() => setShowAddSkillDialog(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add New Skill
                        </Button>
                      )}
                    </div>
                    <TabsList className="mt-2">
                      <TabsTrigger value="offered">Skills I Offer</TabsTrigger>
                      <TabsTrigger value="wanted">Skills I Want</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent>
                    <TabsContent value="offered">
                      <div className="space-y-3">
                        {skillsOffered.length > 0 ? (
                          skillsOffered.map((skill) => (
                          <div 
                            key={skill.id} 
                            className="p-3 border rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <h4 className="font-medium">{skill.name}</h4>
                              <div className="flex space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {skill.category}
                                </Badge>
                                </div>
                            </div>
                            {!editing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleDeleteSkill(skill.id, 'teach')}
                                >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No skills offered yet</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="wanted">
                      <div className="space-y-3">
                        {skillsWanted.length > 0 ? (
                          skillsWanted.map((skill) => (
                          <div 
                            key={skill.id} 
                            className="p-3 border rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <h4 className="font-medium">{skill.name}</h4>
                              <div className="flex space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {skill.category}
                                </Badge>
                                </div>
                            </div>
                            {!editing && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleDeleteSkill(skill.id, 'learn')}
                                >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No skills wanted yet</p>
                        )}
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Add Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select
                value={newAvailability.day}
                onValueChange={(value) => setNewAvailability(prev => ({ ...prev, day: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select
                value={newAvailability.start_time}
                onValueChange={(value) => setNewAvailability(prev => ({ ...prev, start_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Select
                value={newAvailability.end_time}
                onValueChange={(value) => setNewAvailability(prev => ({ ...prev, end_time: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAvailability}>Add Availability</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Skill Name</Label>
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter skill name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={newSkill.category}
                onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Enter skill category"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newSkill.type}
                onValueChange={(value: 'teach' | 'learn') => setNewSkill(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teach">I Can Teach This</SelectItem>
                  <SelectItem value="learn">I Want to Learn This</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSkillDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSkill}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
