import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Search, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  product_type: string;
  category: string;
  thumbnail_url: string;
  creator_id: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProducts(
        products.filter(
          (p) =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login to access admin panel");
        navigate("/login");
        return;
      }

      // Check if user has admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roles) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchProducts();
    } catch (error) {
      toast.error("Failed to verify admin access");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
    }
  };

  const handleDelete = async (productId: string, productTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (error: any) {
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Manage and moderate all products across the platform
          </p>

          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have full administrative access to view, edit, and delete all products.
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Statistics</CardTitle>
              <CardDescription>Overview of platform products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-3xl font-bold text-primary">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-lg">
                  <p className="text-3xl font-bold text-accent-foreground">{products.filter(p => p.product_type === 'ebook').length}</p>
                  <p className="text-sm text-muted-foreground">E-books</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-3xl font-bold">{products.filter(p => p.product_type === 'course').length}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{products.filter(p => p.product_type === 'template').length}</p>
                  <p className="text-sm text-muted-foreground">Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {products.length === 0 ? "No products yet." : "No products found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.thumbnail_url && (
                              <img
                                src={product.thumbnail_url}
                                alt={product.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.product_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product.id, product.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
