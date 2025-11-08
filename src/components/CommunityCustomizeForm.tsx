import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface CommunityCustomizeFormProps {
  onSuccess?: () => void;
}

const CommunityCustomizeForm = ({ onSuccess }: CommunityCustomizeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subscription_price: "",
    is_public: true,
    theme_color: "#1E40AF",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("communities").insert({
        name: formData.name,
        description: formData.description,
        subscription_price: parseFloat(formData.subscription_price) || 0,
        is_public: formData.is_public,
        theme_color: formData.theme_color,
        owner_id: user.id,
      });

      if (error) throw error;

      toast.success("Community created successfully!");
      setFormData({
        name: "",
        description: "",
        subscription_price: "",
        is_public: true,
        theme_color: "#1E40AF",
      });
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Community Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter community name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your community"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscription_price">Monthly Subscription Price (₦)</Label>
        <Input
          id="subscription_price"
          name="subscription_price"
          type="number"
          value={formData.subscription_price}
          onChange={handleInputChange}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
        <p className="text-sm text-muted-foreground">
          Leave as 0 for a free community
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme_color">Theme Color</Label>
        <div className="flex gap-2">
          <Input
            id="theme_color"
            name="theme_color"
            type="color"
            value={formData.theme_color}
            onChange={handleInputChange}
            className="w-20 h-10"
          />
          <Input
            value={formData.theme_color}
            onChange={(e) =>
              setFormData({ ...formData, theme_color: e.target.value })
            }
            placeholder="#1E40AF"
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_public"
          checked={formData.is_public}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_public: checked })
          }
        />
        <Label htmlFor="is_public">Make community public</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Community"}
      </Button>
    </form>
  );
};

export default CommunityCustomizeForm;
