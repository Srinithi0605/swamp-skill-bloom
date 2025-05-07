import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Check, X } from 'lucide-react';
import MessageDialog from '@/components/MessageDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReviewForm from '@/components/ReviewForm';
import { calculateMatchPercentage, getSkillMatches } from '@/utils/matchUtils';

interface Match {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string;
  status: string;
  created_at: string;
  skill: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    email: string;
  };
  learner: {
    id: string;
    email: string;
  };
}

const Matches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<Match[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewMatch, setReviewMatch] = useState<Match | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isLoadingPotential, setIsLoadingPotential] = useState(true);
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [requestingSkillId, setRequestingSkillId] = useState<string>('');
  const [mySkills, setMySkills] = useState<{ teach: Set<string>, learn: Set<string> }>({ teach: new Set(), learn: new Set() });
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [matchPercentages, setMatchPercentages] = useState<Record<string, number>>({});
  const [skillMatchesMap, setSkillMatchesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user) {
      fetchMySkills();
      fetchMatches();
      fetchPotentialMatches();
    }
  }, [user]);

  const fetchMySkills = async () => {
    const { data, error } = await supabase
      .from('user_skills')
      .select('type, skill_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setMySkills({
        teach: new Set(data.filter((s: any) => s.type === 'teach').map((s: any) => s.skill_id)),
        learn: new Set(data.filter((s: any) => s.type === 'learn').map((s: any) => s.skill_id)),
      });
    }
  };

  const fetchMatches = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch matches where the current user is either teacher or learner
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          teacher_id,
          learner_id,
          skill_id,
          status,
          created_at,
          skill:skills (
            id,
            name
          ),
          teacher:users!matches_teacher_id_fkey (
            id,
            email
          ),
          learner:users!matches_learner_id_fkey (
            id,
            email
          )
        `)
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error || !Array.isArray(matches)) throw error;
      // Split matches into pending and confirmed
      const pending = matches.filter((match: any) => match.status === 'pending');
      const confirmed = matches.filter((match: any) => match.status === 'confirmed');
      setPendingMatches(pending);
      setConfirmedMatches(confirmed);
    } catch (error) {
      setPendingMatches([]);
      setConfirmedMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPotentialMatches = async () => {
    console.log('Current user:', user);
    setIsLoadingPotential(true);
    try {
      // First get current user with skills
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('id, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (currentUserError) throw currentUserError;

      // Get current user skills
      const { data: mySkills, error: mySkillsError } = await supabase
        .from('user_skills')
        .select('type, skill:skills(id, name, category)')
        .eq('user_id', user.id);

      if (mySkillsError) throw mySkillsError;

      const currentUser = {
        ...currentUserData,
        skills: mySkills || [],
        skillsTeach: (mySkills || []).filter((s: any) => s.type === 'teach'),
        skillsLearn: (mySkills || []).filter((s: any) => s.type === 'learn')
      };

      // Get other users
      const { data: allUsers, error: userError } = await supabase
        .from('users')
        .select('id, email, avatar_url')
        .neq('id', user.id);

      console.log('Fetched users:', allUsers);

      if (userError || !Array.isArray(allUsers)) throw userError;

      const percentages: Record<string, number> = {};
      const matchesMap: Record<string, any> = {};

      // Fetch skills for each user and calculate match percentage
      for (const u of allUsers as any[]) {
        const { data: skills, error: skillsError } = await supabase
          .from('user_skills')
          .select('type, skill_id, skill:skills(id, name, category)')
          .eq('user_id', u.id);
          
        if (skillsError) {
          console.error(`Error fetching skills for user ${u.id}:`, skillsError);
          continue;
        }
        
        (u as any).skillsTeach = (skills || []).filter((s: any) => s.type === 'teach');
        (u as any).skillsLearn = (skills || []).filter((s: any) => s.type === 'learn');
        (u as any).skills = skills || [];
        
        // Calculate match percentage
        const matchPercentage = calculateMatchPercentage(currentUser, u);
        percentages[u.id] = matchPercentage;
        
        // Get skill matches
        matchesMap[u.id] = getSkillMatches(currentUser, u);
        
        console.log(`User ${u.email} match percentage:`, matchPercentage);
      }

      setMatchPercentages(percentages);
      setSkillMatchesMap(matchesMap);
      
      // Sort users by match percentage, highest first
      const sortedUsers = [...allUsers].sort((a, b) => 
        (percentages[b.id] || 0) - (percentages[a.id] || 0)
      );
      
      setPotentialMatches(sortedUsers);
      console.log('Available matches:', sortedUsers);
    } catch (error) {
      setPotentialMatches([]);
      console.error('Error fetching available matches:', error);
    } finally {
      setIsLoadingPotential(false);
    }
  };

  const handleConfirm = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'confirmed' })
        .eq('id', matchId);

      if (error) throw error;

      // Refresh matches
      fetchMatches();

      toast({
        title: "Success",
        description: "Match confirmed successfully",
      });
    } catch (error) {
      console.error('Error confirming match:', error);
      toast({
        title: "Error",
        description: "Failed to confirm match",
        variant: "destructive"
      });
    }
  };

  const handleDecline = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      // Refresh matches
      fetchMatches();

      toast({
        title: "Success",
        description: "Match declined",
      });
    } catch (error) {
      console.error('Error declining match:', error);
      toast({
        title: "Error",
        description: "Failed to decline match",
        variant: "destructive"
      });
    }
  };

  const handleOpenMessageDialog = (match: Match) => {
    setSelectedMatch(match);
    setMessageDialogOpen(true);
  };

  const getOtherUser = (match: Match) => {
    return user?.id === match.teacher_id ? match.learner : match.teacher;
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleSendRequest = async (otherUser: any, receiveSkillId: string, offerSkillId: string) => {
    try {
      // Validate inputs
      if (!user?.id || !otherUser?.id || !receiveSkillId || !offerSkillId) {
        throw new Error("Please select both skills for the exchange.");
      }

      // Prevent duplicate requests
      const { data: existing, error: existError } = await supabase
        .from('matches')
        .select('id')
        .or(`and(teacher_id.eq.${user.id},learner_id.eq.${otherUser.id},skill_id.eq.${offerSkillId}),and(teacher_id.eq.${otherUser.id},learner_id.eq.${user.id},skill_id.eq.${receiveSkillId})`)
        .in('status', ['pending', 'confirmed']);
      
      if (existError) throw existError;
      
      if (existing && existing.length > 0) {
        toast({ title: 'Already requested', description: 'A match already exists or is pending for this skill exchange.' });
        return;
      }

      // Insert match requests for both skills
      // First match: I teach them
      const { error: error1 } = await supabase
        .from('matches')
        .insert({
          teacher_id: user.id,
          learner_id: otherUser.id,
          skill_id: offerSkillId,
          status: 'pending',
        });

      if (error1) throw error1;
      
      // Second match: They teach me
      const { error: error2 } = await supabase
        .from('matches')
        .insert({
          teacher_id: otherUser.id,
          learner_id: user.id,
          skill_id: receiveSkillId,
          status: 'pending',
        });

      if (error2) throw error2;

      // Refresh matches
      fetchPotentialMatches();
      fetchMatches();

      toast({ 
        title: 'Request sent', 
        description: 'Your skill exchange request has been sent!' 
      });
    } catch (error) {
      console.error('Error sending match request:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to send request', 
        variant: 'destructive' 
      });
    }
  };

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkillId(skillId);
  };

  const handleInviteClick = (otherUser: any) => {
    if (!selectedSkillId) {
      toast({ title: 'Error', description: 'Please select a skill before inviting.', variant: 'destructive' });
      return;
    }
    handleSendRequest(otherUser, selectedSkillId, true);
  };

  const renderPotentialMatches = () => {
    return (
      <TabsContent value="potential">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingPotential ? (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-500">Loading available matches...</p>
            </div>
          ) : potentialMatches.length > 0 ? (
            potentialMatches.map((otherUser: any) => {
              const matchPercent = matchPercentages[otherUser.id] || 0;
              const { theyCanTeachMe, iCanTeachThem } = skillMatchesMap[otherUser.id] || { theyCanTeachMe: [], iCanTeachThem: [] };
              
              return (
                <Card key={otherUser.id} className="p-4 shadow-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="dark:bg-gray-700">{getInitials(otherUser.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{otherUser.email}</h3>
                      <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full dark:text-gray-300">
                        Match: <span className="font-bold">{matchPercent}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills they can teach you */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 dark:text-gray-300">They can teach you:</h4>
                    <div className="flex flex-wrap gap-2">
                      {theyCanTeachMe.length > 0 ? (
                        theyCanTeachMe.map((skill: any) => (
                          <Badge
                            key={skill.id}
                            className={`cursor-pointer bg-primary text-white`}
                            onClick={() => handleSkillSelect(skill.id)}
                          >
                            {skill.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No matching skills</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Skills you can teach them */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 dark:text-gray-300">You can teach them:</h4>
                    <div className="flex flex-wrap gap-2">
                      {iCanTeachThem.length > 0 ? (
                        iCanTeachThem.map((skill: any) => (
                          <Badge
                            key={skill.id}
                            className="bg-secondary text-white"
                          >
                            {skill.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No matching skills</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Skill exchange section */}
                  {theyCanTeachMe.length > 0 && iCanTeachThem.length > 0 && (
                    <div className="mt-6 border-t pt-4 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-center mb-3 dark:text-white">Request Skill Exchange</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">I want to learn:</label>
                          <select 
                            className="w-full p-2 text-sm border rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onChange={(e) => setRequestingSkillId(e.target.value)}
                          >
                            <option value="">Select a skill</option>
                            {theyCanTeachMe.map((skill: any) => (
                              <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">I'll teach:</label>
                          <select
                            className="w-full p-2 text-sm border rounded mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            onChange={(e) => setSelectedSkillId(e.target.value)}
                          >
                            <option value="">Select a skill</option>
                            {iCanTeachThem.map((skill: any) => (
                              <option key={skill.id} value={skill.id}>{skill.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-primary text-white hover:bg-primary-dark mt-3 dark:bg-blue-600 dark:hover:bg-blue-700"
                        onClick={() => handleSendRequest(otherUser, requestingSkillId, selectedSkillId || '')}
                        disabled={!requestingSkillId || !selectedSkillId}
                      >
                        Request Exchange
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 col-span-full">
              <h3 className="text-xl font-medium text-swamp mb-2 dark:text-white">No available matches</h3>
              <p className="text-gray-500 dark:text-gray-400">Add more skills to increase your chances of finding matches.</p>
            </div>
          )}
        </div>
      </TabsContent>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral dark:bg-gray-900">
      <NavBar />

      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-swamp mb-6 dark:text-white">Your Skill Matches</h1>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="flex-1">
                Pending Matches <Badge className="ml-2 bg-primary">{pendingMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex-1">
                Confirmed Matches <Badge className="ml-2 bg-green-500">{confirmedMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="potential" className="flex-1">
                Available Matches <Badge className="ml-2 bg-blue-500">{potentialMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {renderPotentialMatches()}
          </Tabs>
        </div>
      </main>

      {selectedMatch && (
        <MessageDialog
          open={messageDialogOpen}
          onClose={() => setMessageDialogOpen(false)}
          matchId={selectedMatch.id}
          otherUserId={getOtherUser(selectedMatch).id}
          otherUserName={getOtherUser(selectedMatch).email}
          otherUserInitials={getInitials(getOtherUser(selectedMatch).email)}
        />
      )}
      {reviewDialogOpen && reviewMatch && (
        <ReviewForm
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          matchId={reviewMatch.id}
          rateeId={getOtherUser(reviewMatch).id}
          raterId={user.id}
        />
      )}
    </div>
  );
};

export default Matches;
