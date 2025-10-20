import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Palette } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Community = Tables<"communities">;

interface CommunityCustomizeFormProps {
  community?: Community;
  onSuccess?: () => void;
}

export function CommunityCustomizeForm({ community, onSuccess }: CommunityCustomizeFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: community?.name || "",
    description: community?.description || "",
    subscription_price: community?.subscription_price?.toString() || "9.99",
    theme_color: community?.theme_color || "#1E40AF",
    is_public: community?.is_public ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a community",
          variant: "destructive",
        });
        return;
      }

      const communityData = {
        owner_id: user.id,
        name: formData.name,
        description: formData.description,
        subscription_price: parseFloat(formData.subscription_price),
        theme_color: formData.theme_color,
        is_public: formData.is_public,
      };

      if (community) {
        // Update existing community
        const { error } = await supabase
          .from('communities')
          .update(communityData)
          .eq('id', community.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Community updated successfully",
        });
      } else {
        // Create new community
        const { error } = await supabase
          .from('communities')
          .insert(communityData);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Community created successfully",
        });

        // Reset form
        setFormData({
          name: "",
          description: "",
          subscription_price: "9.99",
          theme_color: "#1E40AF",
          is_public: true,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Community save error:', error);
      toast({
        title: "Error",
        description: "Failed to save community. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 shadow-custom-md">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="h-6 w-6 text-primary" />
        <h2>{community ? "Customize Community" : "Create New Community"}</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Community Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Business Mastery Circle"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what your community is about..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Monthly Subscription Price (₦)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.subscription_price}
              onChange={(e) => setFormData({ ...formData, subscription_price: e.target.value })}
              placeholder="9.99"
              required
            />
          </div>

          <div>
            <Label htmlFor="theme_color">Theme Color</Label>
            <div className="flex gap-2">
              <Input
                id="theme_color"
                type="color"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                className="h-10 w-20"
              />
              <Input
                type="text"
                value={formData.theme_color}
                onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                placeholder="#1E40AF"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="is_public" className="cursor-pointer">
              Public Community
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow anyone to discover and join your community
            </p>
          </div>
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
          />
        </div>

        <div 
          className="p-6 rounded-lg border-2"
          style={{ 
            borderColor: formData.theme_color,
            backgroundColor: `${formData.theme_color}10`
          }}
        >
          <h4 className="font-semibold mb-2" style={{ color: formData.theme_color }}>
            Preview
          </h4>
          <p className="text-sm text-muted-foreground">
            Your community will use this color scheme
          </p>
        </div>

        <Button 
          type="submit" 
          variant="hero" 
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {community ? "Update Community" : "Create Community"}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
