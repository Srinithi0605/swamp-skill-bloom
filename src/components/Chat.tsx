
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  matchId: number | string;
  otherUserId: string;
  otherUserName: string;
  otherUserInitials: string;
  onClose?: () => void;
}

const Chat = ({ matchId, otherUserId, otherUserName, otherUserInitials, onClose }: ChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !matchId) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((currentMessages) => [...currentMessages, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !matchId) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message: newMessage.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback className="bg-green-700 text-white">{otherUserInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-bold">{otherUserName}</h3>
        </div>
        {onClose && (
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-center">
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  msg.sender_id === user?.id
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Textarea
            placeholder="Type your message..."
            className="flex-1 resize-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            disabled={!newMessage.trim() || isLoading}
            onClick={handleSendMessage}
            className="shrink-0"
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
