
import { supabase } from '@/integrations/supabase/client';

export const setupMessagesTable = async () => {
  // Set REPLICA IDENTITY to FULL for the messages table to enable realtime
  // This is needed for realtime to work properly with updates/deletes
  const { error } = await supabase.rpc('supabase_functions.http_request', {
    method: 'POST',
    url: '/rest/v1/rpc/exec_sql',
    headers: { 'Content-Type': 'application/json' },
    body: { sql: 'ALTER TABLE messages REPLICA IDENTITY FULL;' }
  });
  
  if (error) {
    console.error('Error setting REPLICA IDENTITY:', error);
  }
};
