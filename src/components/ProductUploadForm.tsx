import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, ImagePlus } from "lucide-react";

interface ProductUploadFormProps {
  onSuccess?: () => void;
}

const ProductUploadForm = ({ onSuccess }: ProductUploadFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    product_type: "",
    category: "",
  });
  const [productFile, setProductFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

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

      let fileUrl = null;
      let thumbnailUrl = null;

      // Upload product file
      if (productFile) {
        const fileExt = productFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("product-files")
          .upload(fileName, productFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-files")
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      // Upload thumbnail
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-files")
          .upload(fileName, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-files")
          .getPublicUrl(fileName);
        
        thumbnailUrl = publicUrl;
      }

      // Create product record
      const { error: insertError } = await supabase.from("products").insert({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        product_type: formData.product_type,
        category: formData.category,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        creator_id: user.id,
      });

      if (insertError) throw insertError;

      toast.success("Product uploaded successfully!");
      setFormData({
        title: "",
        description: "",
        price: "",
        product_type: "",
        category: "",
      });
      setProductFile(null);
      setThumbnailFile(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Product</CardTitle>
        <CardDescription>
          Share your digital products with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Product Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter product title"
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
              placeholder="Describe your product"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_type">Product Type</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, product_type: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Business, Design, Technology"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail Image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Product File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading..." : "Upload Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductUploadForm;
