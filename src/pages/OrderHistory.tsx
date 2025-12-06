import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface Purchase {
  id: string;
  purchased_at: string;
  transaction_id: string | null;
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    product_type: string;
    file_url: string | null;
    thumbnail_url: string | null;
  } | null;
  transaction: {
    amount: number;
    payment_status: string | null;
    payment_method: string;
    currency: string | null;
  } | null;
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      } else {
        setUser(user);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          purchased_at,
          transaction_id,
          product:products (
            id,
            title,
            description,
            price,
            product_type,
            file_url,
            thumbnail_url
          ),
          transaction:transactions (
            amount,
            payment_status,
            payment_method,
            currency
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchases:", error);
      } else {
        setPurchases(data as unknown as Purchase[]);
      }
    };

    fetchPurchases();
  }, [user]);

  const handleDownload = async (fileUrl: string | null, productTitle: string) => {
    if (!fileUrl) return;

    try {
      const { data, error } = await supabase.storage
        .from("product-files")
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = productTitle || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

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
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">View your purchased products and download files</p>
        </div>

        {purchases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring the marketplace to find amazing products
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
                    {purchase.product?.thumbnail_url ? (
                      <img
                        src={purchase.product.thumbnail_url}
                        alt={purchase.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {purchase.product?.title || "Unknown Product"}
                          </h3>
                          <Badge variant="outline" className="capitalize">
                            {purchase.product?.product_type || "Digital"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {purchase.product?.description || "No description available"}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(purchase.purchased_at), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {formatCurrency(
                              purchase.transaction?.amount || purchase.product?.price || 0,
                              purchase.transaction?.currency || "NGN"
                            )}
                          </div>
                          {purchase.transaction?.payment_status && (
                            <Badge className={getStatusColor(purchase.transaction.payment_status)}>
                              {purchase.transaction.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <div className="flex-shrink-0">
                        {purchase.product?.file_url && (
                          <Button
                            onClick={() => handleDownload(purchase.product?.file_url || null, purchase.product?.title || "download")}
                            className="w-full md:w-auto"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistory;