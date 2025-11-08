import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Users } from "lucide-react";
import CommunityCustomizeForm from "./CommunityCustomizeForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Community {
  id: string;
  name: string;
  description: string;
  subscription_price: number;
  member_count: number;
  theme_color: string;
  is_public: boolean;
  created_at: string;
}

const MyCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error: any) {
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this community?")) return;

    try {
      const { error } = await supabase.from("communities").delete().eq("id", id);
      if (error) throw error;

      toast.success("Community deleted successfully");
      fetchCommunities();
    } catch (error: any) {
      toast.error("Failed to delete community");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Communities</h2>
          <p className="text-muted-foreground">Manage your communities</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
            </DialogHeader>
            <CommunityCustomizeForm
              onSuccess={() => {
                setShowCreateForm(false);
                fetchCommunities();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {communities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">You haven't created any communities yet</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Community
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {community.name}
                      {!community.is_public && <Badge variant="secondary">Private</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {community.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(community.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {community.member_count} members
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(community.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xl font-bold">
                    {community.subscription_price > 0
                      ? `₦${community.subscription_price.toLocaleString()}/month`
                      : "Free"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCommunities;
