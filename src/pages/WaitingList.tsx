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
                .neq('user_id', user?.id);

            if (error) throw error;

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

    const handleTeachSkill = async (waitingSkill: WaitingSkill) => {
        if (!user) return;

        setIsLoading(true);
        try {
            const { error: insertError } = await supabase
                .from('user_skills')
                .insert({
                    user_id: user.id,
                    skill_id: waitingSkill.skill_id,
                    type: 'offered' // <-- the correct type
                });

            if (insertError) throw insertError;

            // Remove from UI
            setWaitingSkills((prev) =>
                prev.filter((ws) => ws.id !== waitingSkill.id)
            );

            toast({
                title: "Success",
                description: `You've offered to teach ${waitingSkill.skill.name}`,
                variant: "default"
            });
        } catch (error) {
            console.error('Error offering skill:', error);
            toast({
                title: "Error",
                description: "Could not offer this skill. Please try again.",
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
                                        onClick={() => handleTeachSkill(waitingSkill)}
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary-dark"
                                    >
                                        I Can Teach This
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">
                                    Requested by: {waitingSkill.user.email}
                                </p>
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