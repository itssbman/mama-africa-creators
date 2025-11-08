import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, DollarSign, Users, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Affiliate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      } else {
        setUser(user);
        setReferralLink(`https://hybrrid.com/ref/${user.id.slice(0, 8)}`);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/login");
      } else {
        setUser(session.user);
        setReferralLink(`https://hybrrid.com/ref/${session.user.id.slice(0, 8)}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const stats = [
    { label: "Total Clicks", value: "1,234", icon: <MousePointerClick className="h-6 w-6" /> },
    { label: "Signups", value: "45", icon: <Users className="h-6 w-6" /> },
    { label: "Commission Earned", value: "₦562.50", icon: <DollarSign className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="mb-4">Affiliate Program</h1>
            <p className="text-muted-foreground text-lg">
              Earn 20% commission by referring new creators to AfriCreate
            </p>
          </div>

          {/* Referral Link Card */}
          <Card className="p-6 shadow-custom-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Share2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Your Referral Link</h3>
                <p className="text-sm text-muted-foreground">Share this link to start earning</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button variant="hero" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <div className="mt-4 p-4 bg-accent/5 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Pro tip:</strong> Share your link on social media, blogs, or with friends to maximize your earnings!
              </p>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 shadow-custom-md gradient-card">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 text-primary">
                  {stat.icon}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="p-6 shadow-custom-md mb-8">
            <h3 className="text-xl font-semibold mb-6">How It Works</h3>
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Share Your Link",
                  description: "Copy your unique referral link and share it with creators who might benefit from AfriCreate."
                },
                {
                  step: "2",
                  title: "They Sign Up",
                  description: "When someone creates an account using your link, they become your referral."
                },
                {
                  step: "3",
                  title: "Earn Commission",
                  description: "You earn 20% commission on their first year of earnings through the platform."
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Referrals */}
          <Card className="p-6 shadow-custom-md">
            <h3 className="text-xl font-semibold mb-4">Recent Referrals</h3>
            <div className="space-y-4">
              {[
                { name: "Sarah M.", date: "2 days ago", status: "Active", commission: "₦12.50" },
                { name: "John K.", date: "5 days ago", status: "Active", commission: "₦18.75" },
                { name: "Mary O.", date: "1 week ago", status: "Pending", commission: "₦0.00" }
              ].map((referral, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium">{referral.name}</p>
                    <p className="text-sm text-muted-foreground">{referral.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{referral.commission}</p>
                    <p className="text-xs text-muted-foreground">{referral.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
