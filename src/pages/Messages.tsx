import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import Chat from '@/components/Chat';

interface User {
    id: string;
    name: string;
    email: string;
}

const Messages = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email')
                .neq('id', user?.id);
            if (!error && data) setUsers(data);
        };
        if (user?.id) fetchUsers();
    }, [user]);

    // Simplified user selection handler
    const handleSelectUser = (otherUser: User) => {
        setSelectedUser(otherUser);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <main className="container mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold text-center mb-8">Messages</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* User List */}
                    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 md:col-span-1">
                        <h2 className="text-xl font-semibold mb-2">All Users</h2>
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="mb-4"
                        />
                        <div className="overflow-y-auto max-h-[60vh]">
                            {users.filter(u =>
                                u.name?.toLowerCase().includes(search.toLowerCase()) ||
                                u.email?.toLowerCase().includes(search.toLowerCase())
                            ).map(u => (
                                <Button
                                    key={u.id}
                                    variant={selectedUser?.id === u.id ? 'default' : 'outline'}
                                    className="w-full mb-2 justify-start"
                                    onClick={() => handleSelectUser(u)}
                                >
                                    {u.name || u.email}
                                </Button>
                            ))}
                        </div>
                    </div>
                    {/* Chat Area */}
                    <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4 md:col-span-2 min-h-[60vh]">
                        {selectedUser ? (
                            <Chat
                                otherUserId={selectedUser.id}
                                otherUserName={selectedUser.name || selectedUser.email}
                                otherUserInitials={selectedUser.name?.split(' ').map(n => n[0]).join('') || selectedUser.email[0]}
                                onClose={() => setSelectedUser(null)}
                            />
                        ) : (
                            <div className="text-gray-500 text-center my-auto">Select a user to start chatting.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Messages; 