
import { supabase } from "@/integrations/supabase/client";

export const setupWaitingList = async (email: string, skillName: string) => {
  try {
    // Use type assertion to fix the TypeScript error
    const { data, error } = await supabase
      .from('waiting_list' as any)
      .insert({
        email,
        desired_skill: skillName,
      });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error adding to waiting list:", error);
    return { success: false, error };
  }
};
