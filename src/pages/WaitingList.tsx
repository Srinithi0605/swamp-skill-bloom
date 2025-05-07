
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WaitingListEntry, getWaitingList, addToWaitingList, removeFromWaitingList } from '@/lib/api/waitingList';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

interface SkillItem {
    id: string;
    name: string;
}

const WaitingList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [waitingSkills, setWaitingSkills] = useState<WaitingListEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [availableSkills, setAvailableSkills] = useState<SkillItem[]>([]);
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        fetchWaitingSkills();
        fetchAvailableSkills();
    }, []);

    const fetchWaitingSkills = async () => {
        try {
            setIsLoading(true);
            const data = await getWaitingList();
            setWaitingSkills(data);
        } catch (error) {
            console.error('Error fetching waiting skills:', error);
            toast({
                title: "Error",
                description: "Failed to load waiting skills",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableSkills = async () => {
        try {
            const { data, error } = await supabase
                .from('skills')
                .select('id, name');
            
            if (error) throw error;
            setAvailableSkills(data || []);
        } catch (error) {
            console.error('Error fetching available skills:', error);
        }
    };

    const handleTeachSkill = async (waitingSkill: WaitingListEntry) => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Find the skill ID from the name
            const skillItem = availableSkills.find(
                (skill) => skill.name.toLowerCase() === waitingSkill.desired_skill.toLowerCase()
            );

            if (skillItem) {
                const { error: insertError } = await supabase
                    .from('user_skills')
                    .insert({
                        user_id: user.id,
                        skill_id: skillItem.id,
                        type: 'teach'
                    });

                if (insertError) throw insertError;
            }

            // Remove from waiting list
            await removeFromWaitingList(waitingSkill.id);

            // Update UI
            setWaitingSkills((prev) =>
                prev.filter((ws) => ws.id !== waitingSkill.id)
            );

            toast({
                title: "Success",
                description: `You've offered to teach ${waitingSkill.desired_skill}`,
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

    const handleAddToWaitingList = async () => {
        if (!user || !newSkill.trim()) return;

        setIsLoading(true);
        try {
            const entry = await addToWaitingList(user.email || '', newSkill.trim());
            setWaitingSkills((prev) => [entry, ...prev]);
            setNewSkill('');
            
            toast({
                title: "Success",
                description: "Skill added to waiting list",
            });
        } catch (error) {
            console.error('Error adding to waiting list:', error);
            toast({
                title: "Error",
                description: "Failed to add skill to waiting list",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-neutral dark:bg-gray-900">
            <NavBar />
            <main className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold text-swamp dark:text-white mb-8">Waiting List</h1>

                <Card className="mb-8 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Add a Skill to Wait For</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Enter a skill you want to learn"
                                className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <Button
                                onClick={handleAddToWaitingList}
                                disabled={isLoading || !newSkill.trim()}
                                className="bg-primary hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                Add to Waiting List
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    {waitingSkills.map((waitingSkill) => (
                        <Card key={waitingSkill.id} className="dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xl dark:text-white">{waitingSkill.desired_skill}</span>
                                    </div>
                                    <Button
                                        onClick={() => handleTeachSkill(waitingSkill)}
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
                                    >
                                        I Can Teach This
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Requested by: {waitingSkill.email}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatDate(waitingSkill.created_at)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {waitingSkills.length === 0 && (
                        <Card className="dark:bg-gray-800">
                            <CardContent className="py-8">
                                <p className="text-center text-gray-500 dark:text-gray-400">
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
