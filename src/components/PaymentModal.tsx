import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  productName: string;
  productId?: string;
}

export const PaymentModal = ({ isOpen, onClose, amount, productName, productId }: PaymentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePaystackPayment = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to make a purchase");
        return;
      }

      // Get user session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to make a purchase");
        return;
      }

      // Parse amount (remove ₦ symbol and convert to number)
      const amountValue = parseFloat(amount.replace('₦', '').replace(',', ''));

      // Call edge function to initialize Paystack payment
      const { data, error } = await supabase.functions.invoke('initialize-paystack-payment', {
        body: {
          amount: amountValue,
          email: user.email,
          productId: productId,
          productName: productName,
        },
      });

      if (error) {
        console.error('Payment initialization error:', error);
        throw error;
      }

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Failed to initialize payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtherPayment = (method: string) => {
    toast.error(`${method} integration coming soon. Please use Paystack for now.`);
  };

  const paymentMethods = [
    {
      name: "Paystack",
      icon: <CreditCard className="h-6 w-6" />,
      description: "Pay with card via Paystack"
    },
    {
      name: "Flutterwave",
      icon: <CreditCard className="h-6 w-6" />,
      description: "Pay with card via Flutterwave"
    },
    {
      name: "M-Pesa",
      icon: <Smartphone className="h-6 w-6" />,
      description: "Mobile money payment"
    },
    {
      name: "USSD",
      icon: <Phone className="h-6 w-6" />,
      description: "Pay via USSD code"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-semibold">{productName}</p>
            <p className="text-2xl font-bold text-primary mt-2">{amount}</p>
          </div>

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.name}
                onClick={() => method.name === 'Paystack' ? handlePaystackPayment() : handleOtherPayment(method.name)}
                disabled={isLoading}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-smooth text-left flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {isLoading && method.name === 'Paystack' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    method.icon
                  )}
                </div>
                <div>
                  <p className="font-semibold">{method.name}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
