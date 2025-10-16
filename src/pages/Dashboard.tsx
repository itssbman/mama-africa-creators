import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingBag, Users, TrendingUp, Upload, UserPlus } from "lucide-react";
import { ProductUploadForm } from "@/components/ProductUploadForm";
import { MyProducts } from "@/components/MyProducts";
import { CommunityCustomizeForm } from "@/components/CommunityCustomizeForm";
import { MyCommunities } from "@/components/MyCommunities";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCommunityForm, setShowCommunityForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const stats = [
    { label: "Total Earnings", value: "$2,450.00", icon: <DollarSign className="h-6 w-6" />, change: "+12.5%" },
    { label: "Products Sold", value: "156", icon: <ShoppingBag className="h-6 w-6" />, change: "+8.2%" },
    { label: "Subscribers", value: "89", icon: <Users className="h-6 w-6" />, change: "+15.3%" },
    { label: "Growth Rate", value: "24%", icon: <TrendingUp className="h-6 w-6" />, change: "+5.1%" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="mb-2">Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Creator'}!</h1>
            <p className="text-muted-foreground">Here's an overview of your creator performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 shadow-custom-md gradient-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {stat.icon}
                  </div>
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth">
              <Upload className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Product</h3>
              <p className="text-muted-foreground mb-4">
                Add new ebooks, courses, or templates to your store
              </p>
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                {showUploadForm ? "Hide Upload" : "Upload Now"}
              </Button>
            </Card>

            <Card className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth">
              <Users className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Create Community</h3>
              <p className="text-muted-foreground mb-4">
                Build a subscription-based community for your fans
              </p>
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => setShowCommunityForm(!showCommunityForm)}
              >
                {showCommunityForm ? "Hide Form" : "Create Community"}
              </Button>
            </Card>

            <Card className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth">
              <UserPlus className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Manage Subscribers</h3>
              <p className="text-muted-foreground mb-4">
                View and engage with your subscriber base
              </p>
              <Button variant="hero" className="w-full">View Subscribers</Button>
            </Card>
          </div>

          {/* Product Upload Form */}
          {showUploadForm && (
            <div className="mb-8">
              <ProductUploadForm />
            </div>
          )}

          {/* Community Form */}
          {showCommunityForm && (
            <div className="mb-8">
              <CommunityCustomizeForm onSuccess={() => setShowCommunityForm(false)} />
            </div>
          )}

          {/* My Products */}
          <div className="mb-8">
            <MyProducts />
          </div>

          {/* My Communities */}
          <div className="mb-8">
            <MyCommunities />
          </div>

          {/* Recent Activity */}
          <Card className="p-6 shadow-custom-md">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { action: "New subscriber", detail: "Sarah joined your Business Mastery community", time: "2 hours ago" },
                { action: "Product sold", detail: "African Business eBook purchased", time: "5 hours ago" },
                { action: "Tip received", detail: "$25 tip from John Doe", time: "1 day ago" },
                { action: "New subscriber", detail: "Michael joined your community", time: "2 days ago" }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
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
