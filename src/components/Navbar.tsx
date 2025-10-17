import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles, Users, TrendingUp, DollarSign, Link2, BarChart3, Megaphone, Gift, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-custom-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AfriCreate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/marketplace" className="text-foreground hover:text-primary transition-smooth">
              Marketplace
            </Link>
            <Link to="/communities" className="text-foreground hover:text-primary transition-smooth">
              Communities
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-primary transition-smooth">
                  Dashboard
                </Link>
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-foreground hover:text-primary transition-smooth bg-transparent">
                        Affiliate
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-3 p-6 w-[400px] md:w-[500px] lg:w-[600px] md:grid-cols-2">
                          <Link to="/affiliate" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Dashboard</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              View your affiliate performance and stats
                            </p>
                          </Link>
                          <Link to="/affiliate#referrals" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">My Referrals</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Track all your referred users and signups
                            </p>
                          </Link>
                          <Link to="/affiliate#commissions" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Commission History</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              View your earnings and payout history
                            </p>
                          </Link>
                          <Link to="/affiliate#link" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Referral Link</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Get your unique affiliate referral link
                            </p>
                          </Link>
                          <Link to="/affiliate#analytics" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Analytics</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Detailed performance metrics and insights
                            </p>
                          </Link>
                          <Link to="/affiliate#materials" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <Megaphone className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Marketing Materials</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Download banners, images, and promotional content
                            </p>
                          </Link>
                          <Link to="/affiliate#rewards" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Rewards & Bonuses</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              View special bonuses and milestone rewards
                            </p>
                          </Link>
                          <Link to="/affiliate#support" className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-primary" />
                              <div className="text-sm font-medium leading-none">Support & Help</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Get help with your affiliate account
                            </p>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link
                to="/marketplace"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                to="/communities"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Communities
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-foreground hover:text-primary transition-smooth"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/affiliate"
                    className="text-foreground hover:text-primary transition-smooth"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Affiliate
                  </Link>
                </>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {user ? (
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    Logout
                  </Button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="hero" size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
