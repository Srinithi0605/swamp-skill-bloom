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
      const { data: allUsers, error: userError } = await supabase
        .from('users')
        .select('id, email, avatar_url')
        .neq('id', user.id);

      console.log('Fetched users:', allUsers);

      if (userError || !Array.isArray(allUsers)) throw userError;

      for (const u of allUsers as any[]) {
        const { data: skills, error: skillsError } = await supabase
          .from('user_skills')
          .select('type, skill_id, skill:skills(id, name, category)')
          .eq('user_id', u.id);
        (u as any).skillsTeach = (skills || []).filter((s: any) => s.type === 'offered');
        (u as any).skillsLearn = (skills || []).filter((s: any) => s.type === 'wanted');
        (u as any).skills = skills || [];
        console.log(`User ${u.email} skills:`, skills);
      }

      setPotentialMatches(allUsers);
      console.log('Available matches:', allUsers);
      console.log('Rendering potentialMatches:', potentialMatches);
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

  const handleSendRequest = async (otherUser: any, skillId: string, asTeacher: boolean) => {
    try {
      // Validate inputs
      if (!user?.id || !otherUser?.id || !skillId) {
        throw new Error("Invalid input: Missing user ID, other user ID, or skill ID.");
      }

      // Prevent duplicate requests
      const { data: existing, error: existError } = await supabase
        .from('matches')
        .select('id')
        .or(`teacher_id.eq.${asTeacher ? user.id : otherUser.id},learner_id.eq.${asTeacher ? otherUser.id : user.id}`)
        .eq('skill_id', skillId)
        .in('status', ['pending', 'confirmed']);
      if (existError) throw existError;
      if (existing && existing.length > 0) {
        toast({ title: 'Already requested', description: 'A match already exists or is pending for this skill.' });
        return;
      }

      // Insert match request
      const { error } = await supabase
        .from('matches')
        .insert({
          teacher_id: asTeacher ? user.id : otherUser.id, // Current user is teacher or learner
          learner_id: asTeacher ? otherUser.id : user.id, // Other user is learner or teacher
          skill_id: skillId,
          status: 'pending', // Set status to pending
        });

      if (error) throw error;

      // Refresh matches for both users
      fetchPotentialMatches();
      fetchMatches();

      toast({ title: 'Request sent', description: 'Your match request has been sent!' });
    } catch (error) {
      console.error('Error sending match request:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send request', variant: 'destructive' });
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

  console.log('Rendering potentialMatches:', potentialMatches);

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />

      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-swamp mb-6">Your Skill Matches</h1>

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

            <TabsContent value="pending">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading matches...</p>
                  </div>
                ) : pendingMatches.length > 0 ? (
                  pendingMatches.map((match) => {
                    const otherUser = getOtherUser(match);
                    return (
                      <Card key={match.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-gradient-to-br from-primary to-primary-light p-6 md:w-1/3 flex flex-col justify-between text-white">
                            <div>
                              <div className="flex items-center space-x-3 mb-4">
                                <Avatar className="h-12 w-12 border-2 border-white">
                                  <AvatarFallback className="bg-primary-dark text-white">
                                    {getInitials(otherUser.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold">{otherUser.email}</h3>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Button
                                className="w-full bg-white text-primary hover:bg-neutral"
                                onClick={() => handleConfirm(match.id)}
                              >
                                <Check className="mr-2 h-4 w-4" /> Confirm Match
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-white text-white hover:bg-white/20"
                                onClick={() => handleDecline(match.id)}
                              >
                                <X className="mr-2 h-4 w-4" /> Decline
                              </Button>
                            </div>
                          </div>

                          <div className="p-6 flex-1">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Skill:</h4>
                                <div className="p-4 rounded-lg border border-primary-light">
                                  <h3 className="font-semibold text-primary">{match.skill.name}</h3>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Send a message:</h4>
                              <div className="flex">
                                <Button
                                  variant="outline"
                                  className="flex-1 justify-start"
                                  onClick={() => handleOpenMessageDialog(match)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" /> Hey! I'd love to swap skills...
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-swamp mb-2">No pending matches</h3>
                    <p className="text-gray-500">Add more skills to increase your chances of finding matches.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="confirmed">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading matches...</p>
                  </div>
                ) : confirmedMatches.length > 0 ? (
                  confirmedMatches.map((match) => {
                    const otherUser = getOtherUser(match);
                    return (
                      <Card key={match.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-gradient-to-br from-green-500 to-green-400 p-6 md:w-1/3 flex flex-col justify-between text-white">
                            <div>
                              <div className="flex items-center space-x-3 mb-4">
                                <Avatar className="h-12 w-12 border-2 border-white">
                                  <AvatarFallback className="bg-green-700 text-white">
                                    {getInitials(otherUser.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold">{otherUser.email}</h3>
                                </div>
                              </div>

                              <div className="mb-4">
                                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                                  Match Confirmed!
                                </span>
                              </div>
                            </div>

                            <div className="mt-auto space-y-2">
                              <Button
                                className="w-full bg-white text-green-600 hover:bg-neutral"
                                onClick={() => handleOpenMessageDialog(match)}
                              >
                                <MessageSquare className="mr-2 h-4 w-4" /> Message
                              </Button>
                              <Button
                                className="w-full bg-white text-yellow-600 hover:bg-neutral"
                                onClick={() => { setReviewDialogOpen(true); setReviewMatch(match); }}
                              >
                                Leave Review
                              </Button>
                            </div>
                          </div>

                          <div className="p-6 flex-1">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Skill:</h4>
                                <div className="p-4 rounded-lg border border-green-200">
                                  <h3 className="font-semibold text-green-600">{match.skill.name}</h3>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Next steps:</h4>
                              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm text-gray-800">
                                  <span className="font-medium">Congratulations!</span> You've confirmed this skill swap.
                                  Schedule a time to meet with {otherUser.email.split('@')[0]} and start sharing knowledge.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-swamp mb-2">No confirmed matches yet</h3>
                    <p className="text-gray-500">Accept some pending matches to see them here.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="potential">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingPotential ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading available matches...</p>
                  </div>
                ) : potentialMatches.length > 0 ? (
                  potentialMatches.map((user) => (
                    <Card key={user.id} className="p-4 shadow-md border border-gray-200">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{user.email}</h3>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills Offered:</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsTeach.map((skill: any) => (
                            <Badge
                              key={skill.skill.id}
                              className={`cursor-pointer ${selectedSkillId === skill.skill.id ? 'bg-primary-dark' : 'bg-primary'} text-white`}
                              onClick={() => handleSkillSelect(skill.skill.id)}
                            >
                              {skill.skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills Wanted:</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsLearn.map((skill: any) => (
                            <Badge key={skill.skill.id} className="bg-secondary text-white">
                              {skill.skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Select a Skill Combination:</h4>
                        <select
                          className="w-full p-2 border rounded"
                          value={selectedSkillId || ''}
                          onChange={(e) => handleSkillSelect(e.target.value)}
                        >
                          <option value="" disabled>Select a combination</option>
                          {user.skillsTeach.map((theirSkill: any) => {
                            const isTeachable = mySkills.teach.has(theirSkill.skill.id);
                            console.log("Checking skill combination:", {
                              theirSkill: theirSkill.skill.name,
                              isTeachable,
                            });
                            return (
                              isTeachable && (
                                <option key={theirSkill.skill.id} value={theirSkill.skill.id}>
                                  {`They offer: ${theirSkill.skill.name} | You teach: ${theirSkill.skill.name}`}
                                </option>
                              )
                            );
                          })}
                        </select>
                      </div>
                      <div className="mt-6">
                        <Button
                          className="w-full bg-primary text-white hover:bg-primary-dark"
                          onClick={() => handleInviteClick(user)}
                        >
                          Invite
                        </Button>
                      </div>
                      {user.skillsTeach.map((theirSkill: any) => {
                        console.log("My teachable skills:", mySkills.teach);
                        console.log("Their offered skill ID:", theirSkill.skill.id);
                      })}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-swamp mb-2">No available matches</h3>
                    <p className="text-gray-500">Add more skills to increase your chances of finding matches.</p>
                  </div>
                )}
              </div>
            </TabsContent>
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
