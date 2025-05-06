import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Message {
    id: number;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
}

export const getMessages = async (userId: string, otherUserId: string): Promise<Message[]> => {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
};

export const sendMessage = async (
    senderId: string,
    receiverId: string,
    content: string
): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                sender_id: senderId,
                receiver_id: receiverId,
                content: content,
            },
        ])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}; 