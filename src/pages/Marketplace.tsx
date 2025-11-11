import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Search, Filter, Flag } from "lucide-react";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import { z } from "zod";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  product_type: string;
  category: string;
  thumbnail_url: string;
  creator_id: string;
}

const flagReasonSchema = z.object({
  reason: z.string()
    .trim()
    .min(10, { message: "Reason must be at least 10 characters" })
    .max(500, { message: "Reason must be less than 500 characters" })
});

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flaggedProduct, setFlaggedProduct] = useState<Product | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [submittingFlag, setSubmittingFlag] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const handlePurchase = async (product: Product) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to purchase");
      return;
    }

    setSelectedProduct(product);
    setShowPaymentModal(true);
  };

  const handleFlagClick = async (product: Product) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to report products");
      return;
    }

    setFlaggedProduct(product);
    setFlagReason("");
    setShowFlagDialog(true);
  };

  const handleSubmitFlag = async () => {
    if (!flaggedProduct) return;

    try {
      // Validate the flag reason
      const validation = flagReasonSchema.safeParse({ reason: flagReason });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setSubmittingFlag(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login to report products");
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({
          status: "flagged",
          flag_reason: flagReason.trim(),
          flagged_by: user.id,
          flagged_at: new Date().toISOString()
        })
        .eq("id", flaggedProduct.id);

      if (error) throw error;

      toast.success("Product reported successfully. Admins will review it.");
      setShowFlagDialog(false);
      setFlaggedProduct(null);
      setFlagReason("");
      fetchProducts(); // Refresh the products list
    } catch (error: any) {
      console.error("Error flagging product:", error);
      toast.error("Failed to report product");
    } finally {
      setSubmittingFlag(false);
    }
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            Discover digital products from African creators
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {products.length === 0 ? "No products yet." : "No products found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                    <Badge variant="secondary">{product.product_type}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {product.category && (
                    <Badge variant="outline" className="mb-2">
                      {product.category}
                    </Badge>
                  )}
                  <p className="text-2xl font-bold">₦{product.price.toLocaleString()}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handlePurchase(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Purchase
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleFlagClick(product)}
                    title="Report this product"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {selectedProduct && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          product={selectedProduct}
        />
      )}

      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this product. Our admins will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {flaggedProduct && (
              <div className="text-sm">
                <p className="font-medium">Product: {flaggedProduct.title}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Reason for reporting *</Label>
              <Textarea
                id="flag-reason"
                placeholder="Please describe why you're reporting this product (minimum 10 characters)..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {flagReason.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFlagDialog(false)}
              disabled={submittingFlag}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFlag}
              disabled={submittingFlag || flagReason.trim().length < 10}
            >
              {submittingFlag ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
