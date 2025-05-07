
import { supabase } from '@/integrations/supabase/client';

export const setupMessagesTable = async () => {
  // Set REPLICA IDENTITY to FULL for the messages table to enable realtime
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE messages REPLICA IDENTITY FULL;'  // Changed from 'sql' to 'query'
    });
    
    if (error) {
      console.error('Error setting REPLICA IDENTITY:', error);
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
  }
};
