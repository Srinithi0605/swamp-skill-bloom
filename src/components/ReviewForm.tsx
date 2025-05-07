import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

interface ReviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    rateeId: string;
    raterId: string;
}

const ReviewForm = ({ isOpen, onClose, matchId, rateeId, raterId }: ReviewFormProps) => {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Error",
                description: "Please select a rating",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('ratings')
                .insert({
                    match_id: matchId,
                    ratee_id: rateeId,
                    rater_id: raterId,
                    rating,
                    comment: comment.trim() || null
                });

            if (error) throw error;

            toast({
                title: "Success",
                description: "Review submitted successfully",
            });

            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast({
                title: "Error",
                description: "Failed to submit review",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Session Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex space-x-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setRating(value)}
                                    className={`p-2 rounded-full transition-colors ${rating >= value
                                            ? 'text-yellow-400'
                                            : 'text-gray-300 hover:text-yellow-400'
                                        }`}
                                >
                                    <Star className="h-6 w-6" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comments (Optional)</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows={4}
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewForm; 