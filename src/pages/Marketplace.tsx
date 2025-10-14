import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import productEbook from "@/assets/product-ebook.jpg";
import productCourse from "@/assets/product-course.jpg";
import productTemplate from "@/assets/product-template.jpg";

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const products = [
    {
      id: 1,
      title: "African Business Mastery",
      price: "$29.99",
      category: "Business",
      image: productEbook,
      creator: "Amara Okafor",
      type: "eBook"
    },
    {
      id: 2,
      title: "Entrepreneurship Course",
      price: "$79.99",
      category: "Education",
      image: productCourse,
      creator: "Kwame Mensah",
      type: "Course"
    },
    {
      id: 3,
      title: "Business Plan Templates",
      price: "$19.99",
      category: "Business",
      image: productTemplate,
      creator: "Zara Ibrahim",
      type: "Template"
    },
    {
      id: 4,
      title: "Marketing Strategy Guide",
      price: "$39.99",
      category: "Business",
      image: productEbook,
      creator: "Oluwaseun Adebayo",
      type: "eBook"
    },
    {
      id: 5,
      title: "Digital Content Creation",
      price: "$59.99",
      category: "Lifestyle",
      image: productCourse,
      creator: "Fatima Hassan",
      type: "Course"
    },
    {
      id: 6,
      title: "Financial Planning Toolkit",
      price: "$24.99",
      category: "Business",
      image: productTemplate,
      creator: "Thabo Nkosi",
      type: "Template"
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = category === "all" || product.category === category;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePurchase = (productTitle: string) => {
    toast.success(`Added "${productTitle}" to cart!`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="mb-4">Marketplace</h1>
            <p className="text-muted-foreground text-lg">Discover amazing digital products from African creators</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Religion">Religion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-custom-md hover:shadow-custom-lg transition-smooth">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-smooth"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    <span className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded">
                      {product.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">by {product.creator}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{product.price}</span>
                    <Button 
                      variant="hero" 
                      size="sm"
                      onClick={() => handlePurchase(product.title)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
