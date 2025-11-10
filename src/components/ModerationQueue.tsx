import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FlaggedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  product_type: string;
  category: string;
  thumbnail_url: string;
  status: string;
  flag_reason: string;
  flagged_at: string;
  creator_id: string;
}

export const ModerationQueue = () => {
  const [flaggedProducts, setFlaggedProducts] = useState<FlaggedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<FlaggedProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchFlaggedProducts();
  }, []);

  const fetchFlaggedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("status", ["flagged", "pending"])
        .order("flagged_at", { ascending: false });

      if (error) throw error;
      setFlaggedProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load flagged products");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("products")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          flag_reason: null,
          flagged_at: null,
          flagged_by: null,
        })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Product approved successfully");
      await fetchFlaggedProducts();
    } catch (error: any) {
      toast.error("Failed to approve product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("products")
        .update({
          status: "rejected",
          flag_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast.success("Product rejected");
      setSelectedProduct(null);
      setRejectionReason("");
      await fetchFlaggedProducts();
    } catch (error: any) {
      toast.error("Failed to reject product");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-destructive" />
          <CardTitle>Moderation Queue</CardTitle>
        </div>
        <CardDescription>
          {flaggedProducts.length} product{flaggedProducts.length !== 1 ? 's' : ''} pending review
        </CardDescription>
      </CardHeader>
      <CardContent>
        {flaggedProducts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products pending moderation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flag Reason</TableHead>
                  <TableHead>Flagged</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flaggedProducts.map((product) => (
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
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {product.product_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ₦{product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "flagged" ? "destructive" : "secondary"}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm max-w-xs truncate">
                        {product.flag_reason || "No reason provided"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {product.flagged_at
                        ? new Date(product.flagged_at).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(product.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Dialog
                          open={selectedProduct?.id === product.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setSelectedProduct(null);
                              setRejectionReason("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedProduct(product)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Product</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting "{product.title}"
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Enter rejection reason..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="min-h-[100px]"
                            />
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedProduct(null);
                                  setRejectionReason("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectionReason.trim()}
                              >
                                Reject Product
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
