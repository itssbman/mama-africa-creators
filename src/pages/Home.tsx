import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { ShoppingBag, Users, Heart, DollarSign, Globe, Shield } from "lucide-react";
import heroImage from "@/assets/hero-african-creators.jpg";

export default function Home() {
  const benefits = [
    {
      icon: <ShoppingBag className="h-8 w-8 text-accent" />,
      title: "Sell Digital Products",
      description: "Upload and sell ebooks, templates, courses, and more to a global audience."
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Build Communities",
      description: "Create subscription-based communities and engage with your most loyal fans."
    },
    {
      icon: <Heart className="h-8 w-8 text-accent" />,
      title: "Fan Support",
      description: "Receive tips and mentorship payments directly from supporters."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-accent" />,
      title: "Local Payments",
      description: "Accept payments via Paystack, Flutterwave, M-Pesa, and USSD."
    },
    {
      icon: <Globe className="h-8 w-8 text-accent" />,
      title: "Global Reach",
      description: "Monetize both locally and internationally with seamless transactions."
    },
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: "Secure Platform",
      description: "Your transactions and data are protected with enterprise-grade security."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="African creators" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-primary-foreground mb-6">
              Empowering African Creators to Monetize Locally and Globally
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              The all-in-one platform for digital product sales, subscription communities, 
              and fan support designed for African creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="gold" size="lg">
                  Join as Creator
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-primary-foreground text-primary-foreground hover:bg-background/20">
                  Explore Creators
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-center mb-12">Platform Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth gradient-card border-border">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-16 px-4 bg-secondary">
        <div className="container mx-auto text-center">
          <h2 className="mb-4">Ready to Start Your Creator Journey?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of African creators already monetizing their passion and expertise.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
