import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
    id: number;
    sender: 'me' | 'other';
    content: string;
    created_at: string;
}

interface MessageSystemProps {
    otherUserId: string;
}

const MessageSystem = ({ otherUserId }: MessageSystemProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        setIsLoading(true);

        setMessages([
            ...messages,
            {
                id: messages.length + 1,
                sender: 'me',
                content: newMessage,
                created_at: new Date().toISOString(),
            },
        ]);
        setNewMessage('');
        setIsLoading(false);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${message.sender === 'me'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100'
                                        }`}
                                >
                                    <p>{message.content}</p>
                                    <p className="text-xs mt-1 opacity-70">
                                        {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="mt-4 flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                                handleSendMessage();
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default MessageSystem; 