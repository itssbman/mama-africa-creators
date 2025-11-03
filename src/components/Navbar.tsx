import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-custom-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              HYBRRID
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/communities" className="text-foreground hover:text-primary transition-smooth">
              Communities
            </Link>
            <Link to="/affiliate" className="text-foreground hover:text-primary transition-smooth">
              Affiliate
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="hero" size="sm">
              Get Started
            </Button>
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
                to="/communities"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Communities
              </Link>
              <Link
                to="/affiliate"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setIsMenuOpen(false)}
              >
                Affiliate
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="hero" size="sm" className="w-full">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
