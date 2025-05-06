
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Calendar, MapPin, Clock, Plus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Skill {
  id: number;
  name: string;
  category: string;
  experience: string;
}

interface AvailabilitySlot {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
}

interface Review {
  id: number;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
  skill: string;
}

const Profile = () => {
  const { toast } = useToast();
  
  // Sample user data
  const [user, setUser] = useState({
    name: 'Jamie Smith',
    location: 'Seattle, WA',
    bio: 'Web developer with a passion for design and photography. Always eager to learn new skills and share my knowledge with others.',
    profileImage: '',
    email: 'jamie.smith@example.com'
  });
  
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>([
    { id: 1, name: 'JavaScript Programming', category: 'Technology', experience: '5+ years' },
    { id: 2, name: 'French Language', category: 'Languages', experience: '3 years' },
    { id: 3, name: 'Guitar', category: 'Music', experience: '2 years' }
  ]);
  
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>([
    { id: 1, name: 'Photography', category: 'Arts', experience: 'Beginner' },
    { id: 2, name: 'Cooking', category: 'Food', experience: 'Intermediate' }
  ]);
  
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { id: 1, day: 'Monday', startTime: '18:00', endTime: '20:00' },
    { id: 2, day: 'Wednesday', startTime: '19:00', endTime: '21:00' },
    { id: 3, day: 'Saturday', startTime: '10:00', endTime: '12:00' }
  ]);
  
  const [reviews, setReviews] = useState<Review[]>([
    { 
      id: 1, 
      reviewer: 'Alex Chen', 
      rating: 5, 
      comment: 'Jamie is an excellent JavaScript teacher! Very patient and knowledgeable.', 
      date: '2023-10-15',
      skill: 'JavaScript Programming'
    },
    { 
      id: 2, 
      reviewer: 'Sam Peterson', 
      rating: 4, 
      comment: 'Great French lessons, would definitely recommend!', 
      date: '2023-11-02',
      skill: 'French Language'
    }
  ]);
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({...user});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSaveProfile = () => {
    setUser({...formData});
    setEditing(false);
    toast({
      title: "Success!",
      description: "Your profile has been updated.",
      variant: "default"
    });
  };
  
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

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
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-swamp text-white text-xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="ml-28 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-swamp">{user.name}</h1>
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{user.location}</span>
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
                        <Label htmlFor="name">Name</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          name="location" 
                          value={formData.location}
                          onChange={handleInputChange}
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
                        <p className="text-sm text-gray-700">{user.bio}</p>
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
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {availability.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-primary mr-2" />
                        <span>{slot.day}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-primary mr-2" />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </div>
                  ))}
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
                        <Button size="sm" className="bg-primary hover:bg-primary-dark">
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
                        {skillsOffered.map((skill) => (
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
                                <Badge variant="secondary" className="text-xs">
                                  {skill.experience}
                                </Badge>
                              </div>
                            </div>
                            {!editing && (
                              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="wanted">
                      <div className="space-y-3">
                        {skillsWanted.map((skill) => (
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
                                <Badge variant="secondary" className="text-xs">
                                  {skill.experience}
                                </Badge>
                              </div>
                            </div>
                            {!editing && (
                              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
              
              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{review.reviewer}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {review.date} • {review.skill}
                              </p>
                            </div>
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No reviews yet.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
