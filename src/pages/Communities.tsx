import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Community = Tables<"communities">;

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error("Failed to load communities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (communityId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to join communities");
      navigate("/login");
      return;
    }

    try {
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: user.id,
        });

      if (error) throw error;
      toast.success("Successfully joined community!");
      fetchCommunities();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.info("You're already a member of this community");
      } else {
        toast.error("Failed to join community");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="mb-4">Communities</h1>
            <p className="text-muted-foreground text-lg">
              Join exclusive subscription communities and connect with like-minded creators and learners
            </p>
          </div>

          {/* Communities Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : communities.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No communities yet. Be the first to create one!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {communities.map((community) => (
                <Card 
                  key={community.id} 
                  className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth"
                  style={{ borderLeft: `4px solid ${community.theme_color}` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{community.name}</h3>
                    </div>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${community.theme_color}20`,
                        color: community.theme_color 
                      }}
                    >
                      Community
                    </Badge>
                  </div>

                  {community.description && (
                    <p className="text-muted-foreground mb-6">{community.description}</p>
                  )}

                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{community.member_count} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">Exclusive content</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        ₦{community.subscription_price}/mo
                      </span>
                    </div>
                    <Button 
                      variant="hero"
                      onClick={() => navigate(`/community/${community.id}`)}
                    >
                      Enter Community
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Example Community Feed */}
          <div className="mt-12">
            <Card className="p-6 shadow-custom-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Community Spotlight</h3>
                  <p className="text-sm text-muted-foreground">See what's happening in Business Mastery Circle</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    author: "Amara Okafor",
                    time: "2 hours ago",
                    content: "Just launched a new module on scaling your business! Check it out in the resources section."
                  },
                  {
                    author: "Member - John K.",
                    time: "5 hours ago",
                    content: "Thanks to the strategies shared here, I just closed my biggest deal yet! 🎉"
                  },
                  {
                    author: "Amara Okafor",
                    time: "1 day ago",
                    content: "Weekly Q&A session starts in 30 minutes! Bring your business questions."
                  }
                ].map((post, index) => (
                  <div key={index} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{post.author}</span>
                      <span className="text-xs text-muted-foreground">{post.time}</span>
                    </div>
                    <p className="text-muted-foreground">{post.content}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline">Join to See More</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
