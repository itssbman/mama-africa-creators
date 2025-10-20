import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";

export function ProductUploadForm() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    productType: "ebook" as "ebook" | "course" | "template" | "document",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to upload products",
          variant: "destructive",
        });
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('product-files')
        .getPublicUrl(fileName);

      // Insert product into database
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          product_type: formData.productType,
          category: formData.category,
          file_url: publicUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your product has been uploaded successfully",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        productType: "ebook",
      });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 shadow-custom-md">
      <h2 className="mb-6">Upload New Product</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Product Title</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Business Success Guide"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your product..."
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (₦)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="9.99"
              required
            />
          </div>

          <div>
            <Label htmlFor="productType">Product Type</Label>
            <Select
              value={formData.productType}
              onValueChange={(value: "ebook" | "course" | "template" | "document") => 
                setFormData({ ...formData, productType: value })
              }
            >
              <SelectTrigger id="productType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ebook">eBook</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Business, Education, Technology"
            required
          />
        </div>

        <div>
          <Label htmlFor="file-upload">Upload File</Label>
          <div className="mt-2">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.epub,.zip"
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        <Button 
          type="submit" 
          variant="hero" 
          className="w-full"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Product
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
