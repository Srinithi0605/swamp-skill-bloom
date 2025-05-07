
import { supabase } from '@/integrations/supabase/client';

export const enableRealtimeForMessages = async () => {
  try {
    // Enable row level security for realtime
    await supabase.rpc('enable_realtime', {
      table: 'messages'
    });
  } catch (error) {
    console.error('Error enabling realtime for messages:', error);
  }
};
