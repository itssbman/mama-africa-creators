import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Communities() {
  const communities = [
    {
      id: 1,
      name: "Business Mastery Circle",
      creator: "Amara Okafor",
      members: 234,
      price: "$9.99/month",
      description: "Join a community of ambitious entrepreneurs learning to scale their African businesses.",
      category: "Business"
    },
    {
      id: 2,
      name: "Content Creators Hub",
      creator: "Kwame Mensah",
      members: 456,
      price: "$14.99/month",
      description: "Connect with fellow content creators, share tips, and grow your audience together.",
      category: "Lifestyle"
    },
    {
      id: 3,
      name: "Tech Innovators Network",
      creator: "Zara Ibrahim",
      members: 189,
      price: "$19.99/month",
      description: "For African tech entrepreneurs and developers building the future of technology.",
      category: "Education"
    },
    {
      id: 4,
      name: "Financial Freedom Academy",
      creator: "Oluwaseun Adebayo",
      members: 567,
      price: "$12.99/month",
      description: "Learn investment strategies and financial planning tailored for African markets.",
      category: "Business"
    }
  ];

  const handleJoin = (communityName: string) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast.error("Please login to join communities");
      return;
    }
    toast.success(`Joined ${communityName}! Welcome to the community.`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="mb-4">Communities</h1>
            <p className="text-muted-foreground text-lg">
              Join exclusive subscription communities and connect with like-minded creators and learners
            </p>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {communities.map((community) => (
              <Card key={community.id} className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{community.name}</h3>
                    <p className="text-sm text-muted-foreground">by {community.creator}</p>
                  </div>
                  <Badge variant="secondary">{community.category}</Badge>
                </div>

                <p className="text-muted-foreground mb-6">{community.description}</p>

                <div className="flex items-center gap-6 mb-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{community.members} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Exclusive content</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">{community.price}</span>
                  </div>
                  <Button 
                    variant="hero"
                    onClick={() => handleJoin(community.name)}
                  >
                    Join Community
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Example Community Feed */}
          <div className="mt-12">
            <Card className="p-6 shadow-custom-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Community Spotlight</h3>
                  <p className="text-sm text-muted-foreground">See what's happening in Business Mastery Circle</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    author: "Amara Okafor",
                    time: "2 hours ago",
                    content: "Just launched a new module on scaling your business! Check it out in the resources section."
                  },
                  {
                    author: "Member - John K.",
                    time: "5 hours ago",
                    content: "Thanks to the strategies shared here, I just closed my biggest deal yet! 🎉"
                  },
                  {
                    author: "Amara Okafor",
                    time: "1 day ago",
                    content: "Weekly Q&A session starts in 30 minutes! Bring your business questions."
                  }
                ].map((post, index) => (
                  <div key={index} className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{post.author}</span>
                      <span className="text-xs text-muted-foreground">{post.time}</span>
                    </div>
                    <p className="text-muted-foreground">{post.content}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline">Join to See More</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
