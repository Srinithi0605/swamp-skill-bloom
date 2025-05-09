import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: string;
}

interface ChatProps {
  otherUserId: string;
  otherUserName: string;
  otherUserInitials: string;
  onClose: () => void;
}

const Chat = ({ otherUserId, otherUserName, otherUserInitials, onClose }: ChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch all messages between the two users on mount or when user changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user?.id || !otherUserId) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('timestamp', { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
    };
    fetchMessages();
  }, [user, otherUserId]);

  // Real-time listener for new messages between the two users
  useEffect(() => {
    if (!user?.id || !otherUserId) return;
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new;
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId]);

  // Send a message and save to DB
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: otherUserId,
        message: messageText,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
    } else {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 p-4 border-b dark:bg-[#0a101a] dark:border-gray-700">
        <Avatar>
          <AvatarFallback className="bg-primary text-white">
            {otherUserInitials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{otherUserName}</h3>
          <p className="text-sm text-gray-500">Skill Swap Partner</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${message.sender_id === user?.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-[#1a2233] dark:text-white'
                }`}
            >
              <p>{message.message}</p>
              <p className="text-xs mt-1 opacity-70 dark:text-gray-300">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t dark:bg-[#0a101a] dark:border-gray-700">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] dark:bg-[#1a2233] dark:text-white dark:border-gray-700"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            className="self-end"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
