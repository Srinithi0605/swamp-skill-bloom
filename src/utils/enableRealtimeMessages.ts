
import { supabase } from "@/integrations/supabase/client";

export const enableRealtimeMessages = (matchId: string, callback: () => void) => {
  const channel = supabase
    .channel('realtime-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      } as any, // Type assertion to fix TS error
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
