
import { supabase } from "@/integrations/supabase/client";

export interface WaitingListEntry {
  id: string;
  email: string;
  desired_skill: string;
  user_id?: string;
  created_at: string;
  category?: string;
}

export const addToWaitingList = async (
  email: string,
  desiredSkill: string,
  category?: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('waiting_list' as any)
      .insert({
        email,
        desired_skill: desiredSkill,
        category
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error adding to waiting list:", error);
    return { success: false, error };
  }
};

export const fetchWaitingListEntries = async (): Promise<WaitingListEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('waiting_list' as any)
      .select('*');

    if (error) throw error;
    return data as WaitingListEntry[];
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    return [];
  }
};

// Adding this function to fix the missing export error
export const getWaitingList = fetchWaitingListEntries;

export const removeFromWaitingList = async (
  id: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabase
      .from('waiting_list' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error removing from waiting list:", error);
    return { success: false, error };
  }
};
