import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Skill {
    id: string;
    name: string;
    category: string;
}

const UserInfoForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [formData, setFormData] = useState({
        location: '',
        bio: '',
        skillsToTeach: [] as string[],
        skillsToLearn: [] as string[],
        availability: {
            day: '',
            startTime: '',
            endTime: ''
        }
    });

    // Fetch available skills on component mount
    useState(() => {
        fetchSkills();
    });

    const fetchSkills = async () => {
        try {
            const { data, error } = await supabase
                .from('skills')
                .select('*')
                .order('name');

            if (error) throw error;
            setAvailableSkills(data || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
            toast({
                title: "Error",
                description: "Failed to load skills",
                variant: "destructive"
            });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSkillChange = (type: 'teach' | 'learn', skillId: string) => {
        setFormData(prev => ({
            ...prev,
            [type === 'teach' ? 'skillsToTeach' : 'skillsToLearn']:
                prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'].includes(skillId)
                    ? prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'].filter(id => id !== skillId)
                    : [...prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'], skillId]
        }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Update user profile
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    location: formData.location,
                    bio: formData.bio
                })
                .eq('id', user.id);
            if (profileError) throw profileError;

            // Remove existing user_skills for this user to prevent duplicates
            await supabase
                .from('user_skills')
                .delete()
                .eq('user_id', user.id);

            // Add teaching skills
            const teachingSkills = formData.skillsToTeach.map(skillId => ({
                user_id: user.id,
                skill_id: skillId,
                type: 'teach'
            }));
            // Add learning skills
            const learningSkills = formData.skillsToLearn.map(skillId => ({
                user_id: user.id,
                skill_id: skillId,
                type: 'learn'
            }));
            const allSkills = [...teachingSkills, ...learningSkills];
            if (allSkills.length > 0) {
                const { error: skillsError } = await supabase
                    .from('user_skills')
                    .insert(allSkills);
                if (skillsError) throw skillsError;
            }

            // Remove existing availability for this user to prevent duplicates
            await supabase
                .from('user_availability')
                .delete()
                .eq('user_id', user.id);

            // Add availability
            if (formData.availability.day && formData.availability.startTime && formData.availability.endTime) {
                const { error: availabilityError } = await supabase
                    .from('user_availability')
                    .insert({
                        user_id: user.id,
                        day: formData.availability.day,
                        start_time: formData.availability.startTime,
                        end_time: formData.availability.endTime
                    });
                if (availabilityError) throw availabilityError;
            }

            toast({
                title: "Success",
                description: "Profile information saved successfully",
            });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving user info:', error);
            toast({
                title: "Error",
                description: "Failed to save profile information",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral py-8">
            <div className="container mx-auto px-4 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Complete Your Profile</CardTitle>
                        <CardDescription>
                            Tell us about yourself and your skills to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder="City, Country"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    value={formData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Skills I Can Teach</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {availableSkills.map(skill => (
                                            <Button
                                                key={skill.id}
                                                type="button"
                                                variant={formData.skillsToTeach.includes(skill.id) ? "default" : "outline"}
                                                onClick={() => handleSkillChange('teach', skill.id)}
                                                className="justify-start"
                                            >
                                                {skill.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label>Skills I Want to Learn</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {availableSkills.map(skill => (
                                            <Button
                                                key={skill.id}
                                                type="button"
                                                variant={formData.skillsToLearn.includes(skill.id) ? "default" : "outline"}
                                                onClick={() => handleSkillChange('learn', skill.id)}
                                                className="justify-start"
                                            >
                                                {skill.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Availability</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <Select
                                        value={formData.availability.day}
                                        onValueChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            availability: { ...prev.availability, day: value }
                                        }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monday">Monday</SelectItem>
                                            <SelectItem value="Tuesday">Tuesday</SelectItem>
                                            <SelectItem value="Wednesday">Wednesday</SelectItem>
                                            <SelectItem value="Thursday">Thursday</SelectItem>
                                            <SelectItem value="Friday">Friday</SelectItem>
                                            <SelectItem value="Saturday">Saturday</SelectItem>
                                            <SelectItem value="Sunday">Sunday</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        type="time"
                                        value={formData.availability.startTime}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            availability: { ...prev.availability, startTime: e.target.value }
                                        }))}
                                    />

                                    <Input
                                        type="time"
                                        value={formData.availability.endTime}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            availability: { ...prev.availability, endTime: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Complete Profile"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserInfoForm; 