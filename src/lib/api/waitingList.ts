
import { supabase } from '@/integrations/supabase/client';

export interface WaitingListEntry {
  id: string;
  user_id: string;
  email: string;
  desired_skill: string;
  created_at: string;
}

export const addToWaitingList = async (email: string, desiredSkill: string): Promise<WaitingListEntry> => {
  try {
    const user = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('waiting_list')
      .insert({
        email,
        desired_skill: desiredSkill,
        user_id: user.data.user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as WaitingListEntry;
  } catch (error) {
    console.error('Error adding to waiting list:', error);
    throw error;
  }
};

export const getWaitingList = async (): Promise<WaitingListEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as WaitingListEntry[];
  } catch (error) {
    console.error('Error fetching waiting list:', error);
    throw error;
  }
};

export const removeFromWaitingList = async (entryId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .eq('id', entryId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing from waiting list:', error);
    throw error;
  }
};
