
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Check, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

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

interface WaitListItem {
  id: number;
  skillName: string;
  category: string;
  createdAt: string;
  users: number;
}

const WaitList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    skillName: '',
    category: '',
    description: '',
    notification: true
  });

  // Sample wait list data
  const [waitListItems, setWaitListItems] = useState<WaitListItem[]>([
    {
      id: 1,
      skillName: "Pottery",
      category: "Arts & Crafts",
      createdAt: "2023-10-15",
      users: 5
    },
    {
      id: 2,
      skillName: "React Native Development",
      category: "Programming & Technology",
      createdAt: "2023-11-02",
      users: 12
    },
    {
      id: 3,
      skillName: "Korean Language",
      category: "Languages",
      createdAt: "2023-11-10",
      users: 8
    },
    {
      id: 4,
      skillName: "Sushi Making",
      category: "Cooking & Baking",
      createdAt: "2023-11-20",
      users: 4
    }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      notification: checked
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.skillName || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Add to waitlist (in a real app, this would be a server request)
    const newWaitListItem: WaitListItem = {
      id: waitListItems.length + 1,
      skillName: formData.skillName,
      category: formData.category,
      createdAt: new Date().toISOString().split('T')[0],
      users: 1
    };
    
    setWaitListItems([...waitListItems, newWaitListItem]);
    
    // Reset form
    setFormData({
      skillName: '',
      category: '',
      description: '',
      notification: true
    });
    
    // Show success toast
    toast({
      title: "Success!",
      description: "Your skill has been added to the waiting list.",
      variant: "default"
    });
  };

  const handleTeachSkill = (skillName: string, category: string) => {
    toast({
      title: "Great!",
      description: `You're now offering to teach ${skillName}. Check your dashboard for matches.`,
    });
    
    // In a real app, this would update the user's profile
    // Here we'll simulate by navigating to dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />
      
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-swamp mb-2">Skill Waiting List</h1>
            <p className="text-lg text-gray-600">
              Can't find a skill you want to learn? Add it to our waiting list and get notified when it becomes available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Request Form */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Request a Skill</CardTitle>
                  <CardDescription>
                    Fill out this form to add a skill you're looking for to the waiting list.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="skillName">Skill Name *</Label>
                      <Input 
                        id="skillName" 
                        name="skillName"
                        placeholder="e.g., Japanese Cooking" 
                        value={formData.skillName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {skillCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea 
                        id="description" 
                        name="description"
                        placeholder="Briefly describe what you'd like to learn" 
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch 
                        id="notification" 
                        checked={formData.notification}
                        onCheckedChange={handleSwitchChange}
                      />
                      <Label htmlFor="notification" className="text-sm">
                        Notify me when someone offers this skill
                      </Label>
                    </div>
                    
                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark">
                      Add to Waiting List
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            {/* Current Waiting List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Waiting List</CardTitle>
                  <CardDescription>
                    Skills people are waiting to learn. If you can teach any of these, add them to your profile!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-3 font-medium text-gray-500">Skill</th>
                          <th className="pb-3 font-medium text-gray-500">Category</th>
                          <th className="pb-3 font-medium text-gray-500">Requested</th>
                          <th className="pb-3 font-medium text-gray-500">People Waiting</th>
                          <th className="pb-3 font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitListItems.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-4">
                              <span className="font-medium">{item.skillName}</span>
                            </td>
                            <td className="py-4">
                              <Badge variant="outline">{item.category}</Badge>
                            </td>
                            <td className="py-4 text-sm text-gray-500">
                              {item.createdAt}
                            </td>
                            <td className="py-4">
                              <Badge className="bg-primary">{item.users}</Badge>
                            </td>
                            <td className="py-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={() => handleTeachSkill(item.skillName, item.category)}
                              >
                                I Can Teach This
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-neutral rounded-lg border border-gray-200">
                    <div className="flex items-start">
                      <Bell className="h-5 w-5 text-primary mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-swamp">Can you teach any of these skills?</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          If you can teach any skill on the waiting list, add it to your profile. 
                          You'll immediately be matched with people who want to learn!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-swamp">Your Request Was Added</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          "Watercolor Painting" was added to the waiting list. 
                          We'll notify you when someone offers this skill.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-secondary/10 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-swamp">Skill Now Available</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          "Spanish Language" is now being offered by 3 people. 
                          Check your matches to connect!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WaitList;
