import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Star } from 'lucide-react';
import MessageDialog from './MessageDialog';

interface Skill {
    id: string;
    name: string;
    category: string;
    type: 'teach' | 'learn';
}

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

            // Fetch user availability
            const { data: availabilityData, error: availabilityError } = await supabase
                .from('user_availability')
                .select('*')
                .eq('user_id', id);

            if (availabilityError) throw availabilityError;

            setProfile({
                ...userData,
                skills: skillsData.map(s => ({
                    ...s.skill,
                    type: s.type
                })),
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
            <div className="min-h-screen bg-neutral flex items-center justify-center">
                <p className="text-lg">Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-neutral flex items-center justify-center">
                <p className="text-lg">Profile not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral py-8">
            <div className="container mx-auto px-4">
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {profile.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                                <p className="text-gray-500">{profile.location}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 mb-6">{profile.bio}</p>
                        <div className="flex space-x-4">
                            <Button
                                onClick={() => setIsMessageDialogOpen(true)}
                                className="bg-primary hover:bg-primary-dark"
                            >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Send Message
                            </Button>
                            <Button
                                onClick={handleExpressInterest}
                                variant="outline"
                            >
                                <Star className="mr-2 h-4 w-4" />
                                Express Interest
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Teaching</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills
                                            .filter(skill => skill.type === 'teach')
                                            .map(skill => (
                                                <Badge key={skill.id} variant="secondary">
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Learning</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills
                                            .filter(skill => skill.type === 'learn')
                                            .map(skill => (
                                                <Badge key={skill.id} variant="outline">
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {profile.availability.map((slot, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="font-medium">{slot.day}</span>
                                        <span className="text-gray-500">
                                            {slot.start_time} - {slot.end_time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <MessageDialog
                isOpen={isMessageDialogOpen}
                onClose={() => setIsMessageDialogOpen(false)}
                receiverId={profile.id}
                receiverName={profile.name}
            />
        </div>
    );
};

export default UserProfile; 