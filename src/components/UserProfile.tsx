
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Star } from 'lucide-react';
import MessageDialog from './MessageDialog';
import UserSkillsDisplay from './UserSkillsDisplay';
import { Skill } from '@/contexts/UserSkillsContext';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    bio: string;
    location: string;
    avatar_url: string | null;
    skills: Skill[];
    availability: {
        day: string;
        start_time: string;
        end_time: string;
    }[];
}

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserProfile(userId);
        }
    }, [userId]);

    const fetchUserProfile = async (id: string) => {
        try {
            // Fetch user data
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;

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
                .eq('user_id', id);

            if (skillsError) throw skillsError;

            // Fix the type casting issue by explicitly defining the type
            const typedSkills: Skill[] = skillsData.map(s => ({
                id: s.skill.id,
                name: s.skill.name,
                category: s.skill.category,
                type: s.type as 'teach' | 'learn'
            }));

            // Fetch user availability
            const { data: availabilityData, error: availabilityError } = await supabase
                .from('user_availability')
                .select('*')
                .eq('user_id', id);

            if (availabilityError) throw availabilityError;

            setProfile({
                ...userData,
                skills: typedSkills,
                availability: availabilityData
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast({
                title: "Error",
                description: "Failed to load user profile",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExpressInterest = async () => {
        if (!user || !profile) return;

        try {
            // TODO: Implement interest expression logic
            toast({
                title: "Success",
                description: "Interest expressed successfully",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to express interest",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-gray-900 flex items-center justify-center">
                <p className="text-lg dark:text-white">Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-gray-900 flex items-center justify-center">
                <p className="text-lg dark:text-white">Profile not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg dark:bg-gray-700">
                                    {profile.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl dark:text-white">{profile.name}</CardTitle>
                                <p className="text-gray-500 dark:text-gray-400">{profile.location}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{profile.bio}</p>
                        <div className="flex space-x-4">
                            <Button
                                onClick={() => setIsMessageDialogOpen(true)}
                                className="bg-primary hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                            </Button>
                            <Button
                                onClick={handleExpressInterest}
                                variant="outline"
                                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            >
                                <Star className="mr-2 h-4 w-4" />
                                Express Interest
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="dark:text-white">Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <UserSkillsDisplay skills={profile.skills} />
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="dark:text-white">Availability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {profile.availability.length > 0 ? (
                                    profile.availability.map((slot, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 border rounded-md dark:border-gray-700">
                                            <span className="font-medium dark:text-white">{slot.day}</span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {slot.start_time} - {slot.end_time}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">No availability set</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <MessageDialog
                open={isMessageDialogOpen}
                onClose={() => setIsMessageDialogOpen(false)}
                matchId={profile.id}
                otherUserId={profile.id}
                otherUserName={profile.name}
                otherUserInitials={profile.name.split(' ').map(n => n[0]).join('')}
            />
        </div>
    );
};

export default UserProfile;
