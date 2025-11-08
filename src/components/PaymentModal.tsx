import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    title: string;
    price: number;
  };
}

const PaymentModal = ({ open, onOpenChange, product }: PaymentModalProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login to continue");

      const { data, error } = await supabase.functions.invoke(
        "initialize-paystack-payment",
        {
          body: {
            email: email || user.email,
            amount: product.price * 100,
            productId: product.id,
          },
        }
      );

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      toast.error(error.message || "Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You're purchasing: {product.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePayment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-2xl font-bold">₦{product.price.toLocaleString()}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? "Processing..." : "Pay with Paystack"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Paystack
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
