
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Chat from "@/components/Chat";

interface MessageDialogProps {
  open: boolean;
  onClose: () => void;
  matchId: number | string;
  otherUserId: string;
  otherUserName: string;
  otherUserInitials: string;
}

const MessageDialog = ({
  open,
  onClose,
  matchId,
  otherUserId,
  otherUserName,
  otherUserInitials,
}: MessageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh]">
        <DialogTitle className="sr-only">Chat with {otherUserName}</DialogTitle>
        <div className="h-full pt-2">
          <Chat
            matchId={matchId}
            otherUserId={otherUserId}
            otherUserName={otherUserName}
            otherUserInitials={otherUserInitials}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
