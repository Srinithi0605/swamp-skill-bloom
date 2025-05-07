
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  match_id: string;
  message: string;
  timestamp: string;
}

export const sendMessage = async (
  matchId: string,
  receiverId: string,
  message: string
): Promise<Message> => {
  try {
    const user = await supabase.auth.getUser();
    const senderId = user.data.user?.id;

    if (!senderId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        receiver_id: receiverId,
        message
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (matchId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  matchId: string,
  callback: (message: Message) => void
) => {
  const channel = supabase
    .channel(`match-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
