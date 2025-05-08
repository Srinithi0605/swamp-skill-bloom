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
  user1_id: string;
  user2_id: string;
  user1_skill_id: string;
  user2_skill_id: string;
  status: string;
  created_at: string;
  skill1: {
    id: string;
    name: string;
  };
  skill2: {
    id: string;
    name: string;
  };
  user1: {
    id: string;
    email: string;
    name: string;
  };
  user2: {
    id: string;
    email: string;
    name: string;
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
  const [selectedSkillIds, setSelectedSkillIds] = useState<{ [userId: string]: string }>({});
  const [selectedMySkillIds, setSelectedMySkillIds] = useState<{ [userId: string]: string }>({});
  const [myOfferedSkills, setMyOfferedSkills] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchMySkills();
      fetchMyOfferedSkills();
      fetchMatches();
      fetchPotentialMatches();

      // Subscribe to real-time updates for matches
      const matchesSubscription = supabase
        .channel('matches_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches'
          },
          (payload) => {
            fetchMatches();
          }
        )
        .subscribe();

      return () => {
        matchesSubscription.unsubscribe();
      };
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

  const fetchMyOfferedSkills = async () => {
    const { data, error } = await supabase
      .from('user_skills')
      .select('skill_id, skills(name)')
      .eq('user_id', user.id)
      .eq('type', 'offered');
    if (!error && data) {
      setMyOfferedSkills(
        data
          .filter((s: any) => s.skills && s.skills.name)
          .map((s: any) => ({ id: s.skill_id, name: s.skills.name }))
      );
    }
  };

  const fetchMatches = async (): Promise<void> => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data: matches, error } = await supabase
          .from('matches')
          .select(`
            id,
            user1_id,
            user2_id,
            user1_skill_id,
            user2_skill_id,
            status,
            created_at,
            user1:users!matches_user1_id_fkey (
              id,
              email,
              name
            ),
            user2:users!matches_user2_id_fkey (
              id,
              email,
              name
            ),
            skill1:skills!matches_user1_skill_id_fkey (
              id,
              name
            ),
            skill2:skills!matches_user2_skill_id_fkey (
              id,
              name
            )
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .returns<Partial<Match>[]>();
        if (error || !Array.isArray(matches)) throw error;
        const pending = matches.filter((match): match is Match => 
          match.status === 'pending' &&
          !!match.id &&
          !!match.user1_id &&
          !!match.user2_id &&
          !!match.user1_skill_id &&
          !!match.user2_skill_id &&
          !!match.skill1 &&
          !!match.skill2 &&
          !!match.user1 &&
          !!match.user1.id &&
          !!match.user2 &&
          !!match.user2.id
        );
        const confirmed = matches.filter((match): match is Match => 
          match.status === 'confirmed' &&
          !!match.id &&
          !!match.user1_id &&
          !!match.user2_id &&
          !!match.user1_skill_id &&
          !!match.user2_skill_id &&
          !!match.skill1 &&
          !!match.skill2 &&
          !!match.user1 &&
          !!match.user1.id &&
          !!match.user2 &&
          !!match.user2.id
        );
        setPendingMatches(pending);
        setConfirmedMatches(confirmed);
        console.log('Fetched matches:', matches);
        console.log('Current user:', user.id);
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
        .select('id, email, name, avatar_url')
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
      await fetchMatches();
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
      await fetchMatches();
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
    return user?.id === match.user1_id ? match.user2 : match.user1;
  };

  const getInitials = (name: string | undefined, email: string) => {
    if (name && name.trim().length > 0) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleSendRequest = async (otherUser, theirSkillId, mySkillId) => {
    try {
      if (!user?.id || !otherUser?.id || !theirSkillId || !mySkillId) {
        throw new Error("Invalid input: Missing user ID or skill ID.");
      }
      // Prevent duplicate requests
      // @ts-expect-error
      const { data: existing, error: existError } = await supabase
        .from('matches')
        .select('id')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUser.id}),and(user1_id.eq.${otherUser.id},user2_id.eq.${user.id})`
        )
        .eq('user1_skill_id', theirSkillId)
        .in('status', ['pending', 'confirmed']) as any;
      if (existError) throw existError;
      if (existing && existing.length > 0) {
        toast({
          title: 'Already requested',
          description: 'A match already exists or is pending for this skill.',
          variant: 'destructive'
        });
        return;
      }
      // Insert match request
      const { data: newMatch, error } = await supabase
        .from('matches')
        .insert({
          user1_id: user.id,
          user2_id: otherUser.id,
          user1_skill_id: mySkillId,
          user2_skill_id: theirSkillId,
          status: 'pending',
        } as any)
        .select()
        .single();
      if (error) throw error;
      await fetchMatches();
      setSelectedSkillIds(prev => ({ ...prev, [otherUser.id]: '' }));
      setSelectedMySkillIds(prev => ({ ...prev, [otherUser.id]: '' }));
      toast({
        title: 'Request sent',
        description: 'Your match request has been sent!',
        variant: 'default'
      });
    } catch (error) {
      // handle error
    }
  };

  const handleInviteClick = (otherUser: any) => {
    const skillId = selectedSkillIds[otherUser.id];
    const mySkillId = selectedMySkillIds[otherUser.id];
    if (!skillId || !mySkillId) {
      toast({ title: 'Error', description: 'Please select both skills before inviting.', variant: 'destructive' });
      return;
    }
    handleSendRequest(otherUser, skillId, mySkillId);
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
                    const isUser1 = match.user1_id === user.id;
                    const yourSkill = isUser1 ? match.skill1.name : match.skill2.name;
                    const theirSkill = isUser1 ? match.skill2.name : match.skill1.name;
                    const otherUser = isUser1 ? match.user2 : match.user1;

                    // Show Accept/Decline only if you are the receiver (user2)
                    const showActions = !isUser1 && match.status === 'pending';

                    return (
                      <Card key={match.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-gradient-to-br from-primary to-primary-light p-6 md:w-1/3 flex flex-col justify-between text-white">
                            <div>
                              <div className="flex items-center space-x-3 mb-4">
                                <Avatar className="h-12 w-12 border-2 border-white">
                                  <AvatarFallback className="bg-primary-dark text-white">
                                    {getInitials(otherUser.name, otherUser.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold">{otherUser.name || otherUser.email}</h3>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {showActions && (
                                <div className="flex gap-3 mt-2">
                                  <Button
                                    className="flex-1 bg-green-500 text-white hover:bg-green-600"
                                    onClick={() => handleConfirm(match.id)}
                                  >
                                    <Check className="mr-2 h-4 w-4" /> Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                                    onClick={() => handleDecline(match.id)}
                                  >
                                    <X className="mr-2 h-4 w-4" /> Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="p-6 flex-1">
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Swap Details:</h4>
                                <div className="space-y-3">
                                  <div className="p-4 rounded-lg border border-primary-light">
                                    <h3 className="font-semibold text-primary">You offer:</h3>
                                    <p className="text-lg">{yourSkill}</p>
                                  </div>
                                  <div className="p-4 rounded-lg border border-primary-light">
                                    <h3 className="font-semibold text-primary">{otherUser.name || otherUser.email} offers:</h3>
                                    <p className="text-lg">{theirSkill}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Send a message:</h4>
                              <div className="flex">
                                <Button
                                  variant="outline"
                                  className="flex-1 justify-start"
                                  onClick={() => handleOpenMessageDialog(match)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" /> Message
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
                                    {getInitials(otherUser.name, otherUser.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-bold">{otherUser.name || otherUser.email}</h3>
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
                                  <h3 className="font-semibold text-green-600">{match.skill1.name}</h3>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Next steps:</h4>
                              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-sm text-gray-800">
                                  <span className="font-medium">Congratulations!</span> You've confirmed this skill swap.
                                  Schedule a time to meet with {otherUser.name || otherUser.email.split('@')[0]} and start sharing knowledge.
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
                    <><Card key={user.id} className="p-4 shadow-md border border-gray-200">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-bold text-lg">{user.name || user.email}</h3>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills Offered:</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsTeach.map((skill: any) => (
                            <Badge
                              key={skill.skill.id}
                              className={`${selectedSkillIds[user.id] === skill.skill.id ? 'bg-primary-dark' : 'bg-primary'} text-white cursor-pointer`}
                              onClick={() => setSelectedSkillIds(prev => ({ ...prev, [user.id]: skill.skill.id }))}
                            >
                              {skill.skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div><div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills Wanted:</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skillsLearn.map((skill: any) => (
                            <Badge key={skill.skill.id} className="bg-secondary text-white">
                              {skill.skill.name}
                            </Badge>
                          ))}
                        </div>
                      </div><div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Select Skills to Trade:</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-gray-600 mb-1 block">Their Offered Skills:</label>
                            <select
                              className="w-full p-2 border rounded"
                              value={selectedSkillIds[user.id] || ''}
                              onChange={e => setSelectedSkillIds(prev => ({ ...prev, [user.id]: e.target.value }))}
                            >
                              <option value="" disabled>Select a skill they offer</option>
                              {user.skillsTeach.map((theirSkill: any) => (
                                <option key={theirSkill.skill.id} value={theirSkill.skill.id}>
                                  {theirSkill.skill.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-sm text-gray-600 mb-1 block">Your Skills to Trade:</label>
                            <select
                              className="w-full p-2 border rounded"
                              value={selectedMySkillIds[user.id] || ''}
                              onChange={e => setSelectedMySkillIds(prev => ({ ...prev, [user.id]: e.target.value }))}
                            >
                              <option value="" disabled>Select a skill you can offer</option>
                              {myOfferedSkills.map((skill) => (
                                <option key={skill.id} value={skill.id}>
                                  {skill.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div><div className="mt-6">
                        <Button
                          className="w-full bg-primary text-white hover:bg-primary-dark"
                          onClick={() => handleInviteClick(user)}
                          disabled={!selectedSkillIds[user.id] || !selectedMySkillIds[user.id]}
                        >
                          Invite to Trade
                        </Button>
                      </div>
                      {user.skillsTeach.map((theirSkill: any) => {
                        console.log("My teachable skills:", mySkills.teach);
                        console.log("Their offered skill ID:", theirSkill.skill.id);
                      })}
                    </Card></>
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
          otherUserName={getOtherUser(selectedMatch).name || getOtherUser(selectedMatch).email}
          otherUserInitials={getInitials(getOtherUser(selectedMatch).name, getOtherUser(selectedMatch).email)}
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
}

export default Matches;