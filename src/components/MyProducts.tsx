import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export function MyProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load your products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
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

  if (products.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No products yet. Upload your first product above!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="mb-4">My Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="p-4 shadow-custom-md hover:shadow-custom-lg transition-smooth">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.description?.substring(0, 80)}...
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-primary">
                ₦{product.price}
              </span>
              <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded">
                {product.product_type}
              </span>
            </div>

            {product.category && (
              <p className="text-xs text-muted-foreground mb-3">
                Category: {product.category}
              </p>
            )}

            <div className="flex gap-2">
              {product.file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(product.file_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View File
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(product.id)}
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
