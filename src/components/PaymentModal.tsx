import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Phone } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  productName: string;
}

export const PaymentModal = ({ isOpen, onClose, amount, productName }: PaymentModalProps) => {
  const handlePayment = (method: string) => {
    toast.error(`Payment integration not yet implemented. Please contact the creator directly.`);
    onClose();
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
                onClick={() => handlePayment(method.name)}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-smooth text-left flex items-center gap-4"
              >
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  {method.icon}
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
