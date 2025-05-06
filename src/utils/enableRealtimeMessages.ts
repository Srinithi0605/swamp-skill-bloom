
import { supabase } from '@/integrations/supabase/client';

export const enableRealtimeForMessages = async () => {
  // Enable row level security
  await supabase.rpc('supabase_functions.http_request', {
    method: 'POST',
    url: '/rest/v1/rpc/enable_realtime',
    headers: { 'Content-Type': 'application/json' },
    body: { table: 'messages' }
  });
};
