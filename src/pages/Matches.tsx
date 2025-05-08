import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card } from '@/components/ui/card';
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
  skill1: { id: string; name: string; };
  skill2: { id: string; name: string; };
  user1: { id: string; email: string; name: string; };
  user2: { id: string; email: string; name: string; };
}

const Matches = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<Match[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewMatch, setReviewMatch] = useState<Match | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPotential, setIsLoadingPotential] = useState(true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<{ [userId: string]: string }>({});
  const [selectedMySkillIds, setSelectedMySkillIds] = useState<{ [userId: string]: string }>({});
  const [myOfferedSkills, setMyOfferedSkills] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyOfferedSkills();
      fetchMatches();
      fetchPotentialMatches();
      const matchesSubscription = supabase
        .channel('matches_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches' },
          () => fetchMatches()
        )
        .subscribe();
      return () => { matchesSubscription.unsubscribe(); };
    }
  }, [user]);

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

  const fetchMatches = async () => {
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
          user1:users!matches_teacher_id_fkey (id, email, name),
          user2:users!matches_learner_id_fkey (id, email, name),
          skill1:skills!matches_offered_skill_id_fkey (id, name),
          skill2:skills!matches_skill_id_fkey (id, name)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const typedMatches = matches as unknown as Match[];
      setPendingMatches(
        typedMatches?.filter(
          (m) => m.status === 'pending' && m.user2_id === user.id
        ) ?? []
      );
      setConfirmedMatches(
        typedMatches?.filter((m) => m.status === 'confirmed' && (m.user1_id === user.id || m.user2_id === user.id)) ?? []
      );
    } catch {
      setPendingMatches([]);
      setConfirmedMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPotentialMatches = async () => {
    setIsLoadingPotential(true);
    try {
      const { data: allUsers, error: userError } = await supabase
        .from('users')
        .select('id, email, name, avatar_url')
        .neq('id', user.id);
      if (userError || !Array.isArray(allUsers)) throw userError;
      for (const u of allUsers as any[]) {
        const { data: skills } = await supabase
          .from('user_skills')
          .select('type, skill_id, skill:skills(id, name, category)')
          .eq('user_id', u.id);
        (u as any).skillsTeach = (skills || []).filter((s: any) => s.type === 'offered');
        (u as any).skillsLearn = (skills || []).filter((s: any) => s.type === 'wanted');
      }
      setPotentialMatches(allUsers);
    } catch {
      setPotentialMatches([]);
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
      toast({ title: "Success", description: "Match confirmed successfully" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to confirm match", variant: "destructive" });
      console.error(e);
    }
  };

  const handleDecline = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', matchId);
      if (error) throw error;
      await fetchMatches();
      toast({ title: "Success", description: "Match declined" });
    } catch {
      toast({ title: "Error", description: "Failed to decline match", variant: "destructive" });
    }
  };

  const handleOpenMessageDialog = (match: Match) => {
    setSelectedMatch(match);
    setMessageDialogOpen(true);
  };

  const getOtherUser = (match: Match) => user?.id === match.user1_id ? match.user2 : match.user1;

  const getInitials = (name: string | undefined, email: string) => {
    if (name && name.trim().length > 0) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleSendRequest = async (otherUser: any, theirSkillId: string, mySkillId: string) => {
    try {
      if (!user?.id || !otherUser?.id || !theirSkillId || !mySkillId) {
        throw new Error("Invalid input: Missing user ID or skill ID.");
      }
      // Only block if there is a pending or confirmed match; allow new requests if previous was declined
      const { data: existing, error: existError } = await (
        supabase
          .from('matches')
          .select('id')
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${otherUser.id},user1_skill_id.eq.${mySkillId},user2_skill_id.eq.${theirSkillId}),` +
            `and(user1_id.eq.${otherUser.id},user2_id.eq.${user.id},user1_skill_id.eq.${theirSkillId},user2_skill_id.eq.${mySkillId})`
          )
          .in('status', ['pending', 'confirmed', 'declined'])
      ) as any;

      if (existError) throw existError;
      if (existing && existing.length > 0) {
        toast({
          title: 'Already requested',
          description: 'A match for this skill pair between you two already exists or is pending (in either direction).',
          variant: 'destructive'
        });
        return;
      }
      // Insert match request
      const { error } = await supabase
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send request',
        variant: 'destructive'
      });
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

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <NavBar />
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-swamp mb-6">Your Skill Matches</h1>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="flex-1">
                Match Requests <Badge className="ml-2 bg-primary">{pendingMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex-1">
                All Matches <Badge className="ml-2 bg-green-500">{confirmedMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="potential" className="flex-1">
                Available Matches <Badge className="ml-2 bg-blue-500">{potentialMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>
            {/* Pending Matches */}
            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading matches...</p>
                  </div>
                ) : pendingMatches.length > 0 ? (
                  pendingMatches.map((match) => {
                    const isUser1 = match.user1_id === user.id;
                    const otherUser = isUser1 ? match.user2 : match.user1;
                    const showActions = !isUser1 && match.status === 'pending';
                    return (
                      <Card key={match.id} className="p-6 flex flex-col gap-4 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(otherUser.name, otherUser.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{otherUser.name || otherUser.email}</h3>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Skills They Offer:</h4>
                          <Badge className="bg-primary text-white text-base px-3 py-1 rounded-full">{match.skill2?.name || 'Unknown'}</Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Skills They Want:</h4>
                          <Badge className="bg-secondary text-white text-base px-3 py-1 rounded-full">{match.skill1?.name || 'Unknown'}</Badge>
                        </div>
                        {showActions && (
                          <div className="flex gap-2 mt-2">
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
            {/* Confirmed Matches */}
            <TabsContent value="confirmed">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading matches...</p>
                  </div>
                ) : confirmedMatches.length > 0 ? (
                  confirmedMatches.map((match) => {
                    const isUser1 = match.user1_id === user.id;
                    const otherUser = isUser1 ? match.user2 : match.user1;
                    return (
                      <Card key={match.id} className="p-6 flex flex-col gap-4 shadow-lg border border-green-200">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{getInitials(otherUser.name, otherUser.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{otherUser.name || otherUser.email}</h3>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Skills They Offer:</h4>
                          <Badge className="bg-primary text-white text-base px-3 py-1 rounded-full">{match.skill2?.name || 'Unknown'}</Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Skills They Want:</h4>
                          <Badge className="bg-secondary text-white text-base px-3 py-1 rounded-full">{match.skill1?.name || 'Unknown'}</Badge>
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
            {/* Potential Matches */}
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
                      </div>
                      <div className="mt-6">
                        <Button
                          className="w-full bg-primary text-white hover:bg-primary-dark"
                          onClick={() => handleInviteClick(user)}
                          disabled={!selectedSkillIds[user.id] || !selectedMySkillIds[user.id]}
                        >
                          Invite to Trade
                        </Button>
                      </div>
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
};

export default Matches;
