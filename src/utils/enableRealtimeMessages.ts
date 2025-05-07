
import { supabase } from '@/integrations/supabase/client';

export const enableRealtimeForMessages = async () => {
  try {
    // Enable realtime for the messages table using the appropriate type
    await supabase.rpc('enable_realtime', {
      table_name: 'messages'  // Changed from 'table' to 'table_name' based on the supabase function
    });
  } catch (error) {
    console.error('Error enabling realtime for messages:', error);
  }
};
