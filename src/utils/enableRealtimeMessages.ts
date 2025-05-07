
import { supabase } from '@/integrations/supabase/client';

export const enableRealtimeForMessages = async () => {
  try {
    // Enable realtime for the messages table by executing raw SQL
    await supabase.rpc('exec_sql', {
      query: 'ALTER PUBLICATION supabase_realtime ADD TABLE messages;'
    });
    
    console.log('Realtime enabled for messages table');
  } catch (error) {
    console.error('Error enabling realtime for messages:', error);
  }
};
