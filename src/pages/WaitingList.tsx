import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Skill {
    id: string;
    name: string;
}

interface WaitingSkill {
    id: string;
    skill_id: string;
    user_id: string;
    skill: Skill;
    user: {
        id: string;
        email: string;
    };
}

const WaitingList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [waitingSkills, setWaitingSkills] = useState<WaitingSkill[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchWaitingSkills();
    }, []);

    const fetchWaitingSkills = async () => {
        try {
            const { data, error } = await supabase
                .from('user_skills')
                .select(`
                    id,
                    skill_id,
                    user_id,
                    skill:skills (
                        id,
                        name
                    ),
                    user:users (
                        id,
                        email
                    )
                `)
                .eq('type', 'learn')
                .neq('user_id', user?.id); // Exclude current user's skills

            if (error) throw error;

            // Cast the data to WaitingSkill[] type
            const typedSkills = (data || []).map(skill => ({
                ...skill,
                skill: {
                    id: skill.skill.id,
                    name: skill.skill.name
                },
                user: {
                    id: skill.user.id,
                    email: skill.user.email
                }
            }));

            setWaitingSkills(typedSkills);
        } catch (error) {
            console.error('Error fetching waiting skills:', error);
            toast({
                title: "Error",
                description: "Failed to load waiting skills",
                variant: "destructive"
            });
        }
    };

    const handleTeachSkill = async (skillId: string, learnerId: string) => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Check if a match already exists
            const { data: existingMatch, error: matchCheckError } = await supabase
                .from('matches')
                .select('id')
                .eq('teacher_id', user.id)
                .eq('learner_id', learnerId)
                .eq('skill_id', skillId)
                .single();

            if (matchCheckError && matchCheckError.code !== 'PGRST116') {
                throw matchCheckError;
            }

            if (existingMatch) {
                toast({
                    title: "Match Exists",
                    description: "You are already matched for this skill",
                });
                return;
            }

            // Add the skill to user's teaching skills
            const { error: skillError } = await supabase
                .from('user_skills')
                .insert({
                    user_id: user.id,
                    skill_id: skillId,
                    type: 'teach'
                });

            if (skillError) throw skillError;

            // Create a match between the teacher and learner
            const { error: matchError } = await supabase
                .from('matches')
                .insert({
                    teacher_id: user.id,
                    learner_id: learnerId,
                    skill_id: skillId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (matchError) throw matchError;

            toast({
                title: "Success",
                description: "Match created successfully! You can now view it in your dashboard.",
            });

            // Refresh the waiting skills list
            fetchWaitingSkills();
        } catch (error) {
            console.error('Error creating match:', error);
            toast({
                title: "Error",
                description: "Failed to create match. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral">
            <NavBar />
            <main className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold text-swamp mb-8">Waiting List</h1>

                <div className="grid gap-6">
                    {waitingSkills.map((waitingSkill) => (
                        <Card key={waitingSkill.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xl">{waitingSkill.skill.name}</span>
                                    </div>
                                    <Button
                                        onClick={() => handleTeachSkill(waitingSkill.skill_id, waitingSkill.user_id)}
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary-dark"
                                    >
                                        I Can Teach This
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">
                                        Requested by: {waitingSkill.user.email}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {waitingSkills.length === 0 && (
                        <Card>
                            <CardContent className="py-8">
                                <p className="text-center text-gray-500">
                                    No skills are currently in the waiting list
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WaitingList; 