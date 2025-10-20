import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Trash2, Users } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { CommunityCustomizeForm } from "./CommunityCustomizeForm";

type Community = Tables<"communities">;

export function MyCommunities() {
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: "Error",
        description: "Failed to load your communities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community?')) return;

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      fetchCommunities();
    } catch (error) {
      console.error('Error deleting community:', error);
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  if (editingCommunity) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setEditingCommunity(null)}
        >
          ← Back to Communities
        </Button>
        <CommunityCustomizeForm 
          community={editingCommunity}
          onSuccess={() => {
            setEditingCommunity(null);
            fetchCommunities();
          }}
        />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No communities yet. Create your first community above!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4">My Communities</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {communities.map((community) => (
          <Card 
            key={community.id} 
            className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth"
            style={{ borderLeft: `4px solid ${community.theme_color}` }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">{community.name}</h3>
              {community.description && (
                <p className="text-sm text-muted-foreground">
                  {community.description.substring(0, 100)}...
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-primary">
                  ₦{community.subscription_price}/mo
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">{community.member_count} members</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <span 
                className="px-2 py-1 text-xs rounded"
                style={{ 
                  backgroundColor: `${community.theme_color}20`,
                  color: community.theme_color 
                }}
              >
                {community.is_public ? "Public" : "Private"}
              </span>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCommunity(community)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(community.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
