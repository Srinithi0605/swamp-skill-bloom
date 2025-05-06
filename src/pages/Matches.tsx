
import { useState } from 'react';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Check, X } from 'lucide-react';

interface MatchUser {
  id: number;
  name: string;
  skillOffered: string;
  skillRequested: string;
  matchPercentage: number;
  avatarInitials: string;
  location: string;
}

const Matches = () => {
  // Sample data for demonstration
  const [pendingMatches, setPendingMatches] = useState<MatchUser[]>([
    { 
      id: 1, 
      name: 'Alex Johnson', 
      skillOffered: 'Photography', 
      skillRequested: 'JavaScript Programming',
      matchPercentage: 92,
      avatarInitials: 'AJ',
      location: 'New York, NY'
    },
    { 
      id: 2, 
      name: 'Sam Rivera', 
      skillOffered: 'Cooking', 
      skillRequested: 'French Language',
      matchPercentage: 85,
      avatarInitials: 'SR',
      location: 'Austin, TX'
    },
    { 
      id: 3, 
      name: 'Taylor Wong', 
      skillOffered: 'Yoga', 
      skillRequested: 'Guitar',
      matchPercentage: 78,
      avatarInitials: 'TW',
      location: 'Portland, OR'
    },
  ]);

  const [confirmedMatches, setConfirmedMatches] = useState<MatchUser[]>([
    { 
      id: 4, 
      name: 'Jordan Lee', 
      skillOffered: 'Spanish Language', 
      skillRequested: 'Web Design',
      matchPercentage: 95,
      avatarInitials: 'JL',
      location: 'Chicago, IL'
    },
    { 
      id: 5, 
      name: 'Morgan Smith', 
      skillOffered: 'Drawing', 
      skillRequested: 'JavaScript Programming',
      matchPercentage: 88,
      avatarInitials: 'MS',
      location: 'Seattle, WA'
    },
  ]);

  const handleConfirm = (id: number) => {
    const matchToMove = pendingMatches.find(match => match.id === id);
    if (matchToMove) {
      setPendingMatches(pendingMatches.filter(match => match.id !== id));
      setConfirmedMatches([...confirmedMatches, matchToMove]);
    }
  };

  const handleDecline = (id: number) => {
    setPendingMatches(pendingMatches.filter(match => match.id !== id));
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
                Pending Matches <Badge className="ml-2 bg-primary">{pendingMatches.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex-1">
                Confirmed Matches <Badge className="ml-2 bg-green-500">{confirmedMatches.length}</Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingMatches.length > 0 ? (
                  pendingMatches.map((match) => (
                    <Card key={match.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="bg-gradient-to-br from-primary to-primary-light p-6 md:w-1/3 flex flex-col justify-between text-white">
                          <div>
                            <div className="flex items-center space-x-3 mb-4">
                              <Avatar className="h-12 w-12 border-2 border-white">
                                <AvatarFallback className="bg-primary-dark text-white">{match.avatarInitials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-bold">{match.name}</h3>
                                <p className="text-sm opacity-90">{match.location}</p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                                {match.matchPercentage}% Match
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto space-y-2">
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
                        
                        <div className="p-6 md:w-2/3">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">They're offering:</h4>
                              <div className="p-4 rounded-lg border border-primary-light">
                                <h3 className="font-semibold text-primary">{match.skillOffered}</h3>
                                <p className="text-sm mt-2 text-gray-600">
                                  This is what {match.name.split(' ')[0]} can teach you.
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">They're looking for:</h4>
                              <div className="p-4 rounded-lg border border-secondary-light">
                                <h3 className="font-semibold text-secondary">{match.skillRequested}</h3>
                                <p className="text-sm mt-2 text-gray-600">
                                  This is what you can teach {match.name.split(' ')[0]}.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Send a message:</h4>
                            <div className="flex">
                              <Button variant="outline" className="flex-1 justify-start">
                                <MessageSquare className="mr-2 h-4 w-4" /> Hey! I'd love to swap skills...
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
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
                {confirmedMatches.length > 0 ? (
                  confirmedMatches.map((match) => (
                    <Card key={match.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="bg-gradient-to-br from-green-500 to-green-400 p-6 md:w-1/3 flex flex-col justify-between text-white">
                          <div>
                            <div className="flex items-center space-x-3 mb-4">
                              <Avatar className="h-12 w-12 border-2 border-white">
                                <AvatarFallback className="bg-green-700 text-white">{match.avatarInitials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-bold">{match.name}</h3>
                                <p className="text-sm opacity-90">{match.location}</p>
                              </div>
                            </div>
                            
                            <div className="mb-4">
                              <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                                Match Confirmed!
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-auto">
                            <Button 
                              className="w-full bg-white text-green-600 hover:bg-neutral"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" /> Message
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-6 md:w-2/3">
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">They're offering:</h4>
                              <div className="p-4 rounded-lg border border-green-200">
                                <h3 className="font-semibold text-green-600">{match.skillOffered}</h3>
                                <p className="text-sm mt-2 text-gray-600">
                                  This is what {match.name.split(' ')[0]} will teach you.
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">They're looking for:</h4>
                              <div className="p-4 rounded-lg border border-green-200">
                                <h3 className="font-semibold text-green-600">{match.skillRequested}</h3>
                                <p className="text-sm mt-2 text-gray-600">
                                  This is what you'll teach {match.name.split(' ')[0]}.
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Next steps:</h4>
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                              <p className="text-sm text-gray-800">
                                <span className="font-medium">Congratulations!</span> You've confirmed this skill swap. 
                                Schedule a time to meet with {match.name.split(' ')[0]} and start sharing knowledge.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-swamp mb-2">No confirmed matches yet</h3>
                    <p className="text-gray-500">Accept some pending matches to see them here.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Matches;
