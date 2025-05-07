import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  onClose: () => void;
}

const Chat = ({ matchId, otherUserId, otherUserName, otherUserInitials, onClose }: ChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      receiver_id: otherUserId,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 p-4 border-b">
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
                  : 'bg-gray-100'
                }`}
            >
              <p>{message.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px]"
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
