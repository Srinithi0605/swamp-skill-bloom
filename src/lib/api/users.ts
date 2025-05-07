
import { supabase } from '@/integrations/supabase/client';

export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
