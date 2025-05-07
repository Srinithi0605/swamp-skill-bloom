import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import NavBar from '@/components/NavBar';

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

const ProfileSetup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        location: '',
        bio: '',
        skillsToTeach: [] as string[],
        skillsToLearn: [] as string[],
        availability: [] as { day: string; start_time: string; end_time: string }[]
    });

    const totalSteps = 3;
    const progress = (currentStep / totalSteps) * 100;

    useEffect(() => {
        if (!user) {
            navigate('/signin');
        }
    }, [user, navigate]);

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddSkill = (type: 'teach' | 'learn', skill: string) => {
        setFormData(prev => ({
            ...prev,
            [type === 'teach' ? 'skillsToTeach' : 'skillsToLearn']: [
                ...prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'],
                skill
            ]
        }));
    };

    const handleRemoveSkill = (type: 'teach' | 'learn', skill: string) => {
        setFormData(prev => ({
            ...prev,
            [type === 'teach' ? 'skillsToTeach' : 'skillsToLearn']:
                prev[type === 'teach' ? 'skillsToTeach' : 'skillsToLearn'].filter(s => s !== skill)
        }));
    };

    const handleAddAvailability = (day: string, start: string, end: string) => {
        setFormData(prev => ({
            ...prev,
            availability: [...prev.availability, { day, start_time: start, end_time: end }]
        }));
    };

    const handleRemoveAvailability = (index: number) => {
        setFormData(prev => ({
            ...prev,
            availability: prev.availability.filter((_, i) => i !== index)
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
                    bio: formData.bio,
                    profile_completed: true
                })
                .eq('id', user.id);
            if (profileError) throw new Error('Profile update: ' + profileError.message);

            // Add teaching and learning skills using skill_id
            const allSkills = [
                ...formData.skillsToTeach.map(skillName => ({ name: skillName, type: 'teach' })),
                ...formData.skillsToLearn.map(skillName => ({ name: skillName, type: 'learn' })),
            ];

            for (const skill of allSkills) {
                // 1. Find or create the skill in the skills table
                let { data: skillData, error: skillLookupError } = await supabase
                    .from('skills')
                    .select('id')
                    .eq('name', skill.name)
                    .single();

                if (skillLookupError && skillLookupError.code !== 'PGRST116') { // Not found is ok
                    throw new Error('Skill lookup: ' + skillLookupError.message);
                }

                let skillId = skillData?.id;
                if (!skillId) {
                    // Insert new skill
                    const { data: newSkill, error: skillInsertError } = await supabase
                        .from('skills')
                        .insert({ name: skill.name, category: 'Other' }) // or use actual category if available
                        .select('id')
                        .single();
                    if (skillInsertError) throw new Error('Skill insert: ' + skillInsertError.message);
                    skillId = newSkill.id;
                }

                // Ensure type is exactly 'teach' or 'learn'
                const type = skill.type === 'teach' ? 'teach' : 'learn';
                console.log('Inserting user_skill:', { user_id: user.id, skill_id: skillId, type });

                // 2. Insert into user_skills
                const { error: userSkillError } = await supabase
                    .from('user_skills')
                    .insert({
                        user_id: user.id,
                        skill_id: skillId,
                        type,
                    });
                if (userSkillError) throw new Error('User skill insert: ' + userSkillError.message);
            }

            // Add availability
            if (formData.availability.length > 0) {
                const { error: availabilityError } = await supabase
                    .from('user_availability')
                    .insert(formData.availability.map(slot => ({
                        user_id: user.id,
                        ...slot
                    })));
                if (availabilityError) throw new Error('Availability insert: ' + availabilityError.message);
            }

            toast({
                title: "Profile completed!",
                description: "Your profile has been set up successfully.",
            });

            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error setting up profile:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to set up profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
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
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-medium">Skills you can teach</h3>
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => handleAddSkill('teach', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a skill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skillCategories.map((category) => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skillsToTeach.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                                        <span>{skill}</span>
                                        <button
                                            onClick={() => handleRemoveSkill('teach', skill)}
                                            className="text-primary hover:text-primary-dark"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-medium">Skills you want to learn</h3>
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => handleAddSkill('learn', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a skill" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skillCategories.map((category) => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.skillsToLearn.map((skill, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded-full">
                                        <span>{skill}</span>
                                        <button
                                            onClick={() => handleRemoveSkill('learn', skill)}
                                            className="text-secondary hover:text-secondary-dark"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <h3 className="font-medium">Your Availability</h3>
                        <div className="space-y-4">
                            {formData.availability.map((slot, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span>{slot.day}</span>
                                    <span>{slot.start_time} - {slot.end_time}</span>
                                    <button
                                        onClick={() => handleRemoveAvailability(index)}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => handleAddAvailability(value, '09:00', '17:00')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Add day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                            <SelectItem key={day} value={day}>{day}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-neutral">
            <NavBar />
            <div className="container mx-auto py-8 px-4">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Complete Your Profile</CardTitle>
                        <CardDescription>
                            Step {currentStep} of {totalSteps}
                        </CardDescription>
                        <Progress value={progress} className="mt-4" />
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                            {renderStep()}
                            <div className="flex justify-between pt-4">
                                {currentStep > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                    >
                                        Previous
                                    </Button>
                                )}
                                {currentStep < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={() => setCurrentStep(prev => prev + 1)}
                                        className="ml-auto"
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="ml-auto"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : 'Complete Setup'}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfileSetup; 