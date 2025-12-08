import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/StarRating";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, User as UserIcon } from "lucide-react";
import { z } from "zod";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
}

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().trim().max(100, "Title must be less than 100 characters").optional(),
  content: z.string().trim().max(1000, "Review must be less than 1000 characters").optional(),
});

export const ProductReviews = ({
  open,
  onOpenChange,
  productId,
  productTitle,
}: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      fetchReviews();
      checkUserEligibility();
    }
  }, [open, productId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const checkUserEligibility = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      setCanReview(false);
      setHasReviewed(false);
      return;
    }

    // Check if user has purchased this product
    const { data: purchases } = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .limit(1);

    const hasPurchased = purchases && purchases.length > 0;

    // Check if user has already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    setCanReview(hasPurchased && !existingReview);
    setHasReviewed(!!existingReview);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    const validation = reviewSchema.safeParse({ rating, title, content });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      content: content.trim() || null,
    });

    if (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setContent("");
      setCanReview(false);
      setHasReviewed(true);
      fetchReviews();
    }

    setSubmitting(false);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reviews for {productTitle}</DialogTitle>
          <DialogDescription>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={Math.round(averageRating)} size="sm" />
                <span className="text-sm">
                  {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            ) : (
              "No reviews yet"
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Review Form */}
          {canReview && (
            <div className="space-y-4 pb-4">
              <h4 className="font-medium">Write a Review</h4>
              <div className="space-y-3">
                <div>
                  <Label>Your Rating *</Label>
                  <div className="mt-1">
                    <StarRating
                      rating={rating}
                      size="lg"
                      interactive
                      onRatingChange={setRating}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="review-title">Title (optional)</Label>
                  <Input
                    id="review-title"
                    placeholder="Summarize your experience"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="review-content">Review (optional)</Label>
                  <Textarea
                    id="review-content"
                    placeholder="Share your thoughts about this product..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || rating === 0}
                  className="w-full"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
              <Separator />
            </div>
          )}

          {hasReviewed && !canReview && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
              You have already reviewed this product.
            </div>
          )}

          {!user && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
              Please login to leave a review.
            </div>
          )}

          {user && !canReview && !hasReviewed && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
              Purchase this product to leave a review.
            </div>
          )}

          {/* Reviews List */}
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <StarRating rating={review.rating} size="sm" />
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <h5 className="font-medium mb-1">{review.title}</h5>
                  )}
                  {review.content && (
                    <p className="text-sm text-muted-foreground">{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};