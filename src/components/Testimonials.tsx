import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Amina Okonkwo",
    role: "Digital Author",
    location: "Lagos, Nigeria",
    rating: 5,
    content: "This platform has transformed my writing career. I've sold over 500 ebooks in just 3 months! The payment integration works seamlessly with my local bank.",
    initials: "AO"
  },
  {
    name: "Kwame Mensah",
    role: "Online Course Creator",
    location: "Accra, Ghana",
    rating: 5,
    content: "Finally, a platform that understands African creators. The community features helped me build a loyal subscriber base that supports my content monthly.",
    initials: "KM"
  },
  {
    name: "Fatima Hassan",
    role: "Graphic Designer",
    location: "Nairobi, Kenya",
    rating: 5,
    content: "Selling my design templates has never been easier. The platform is intuitive, and I love that my fans can support me through tips and subscriptions.",
    initials: "FH"
  },
  {
    name: "Chidi Nwachukwu",
    role: "Business Consultant",
    location: "Abuja, Nigeria",
    rating: 5,
    content: "The affiliate program is a game-changer. I earn additional income promoting other creators' products while growing my own audience.",
    initials: "CN"
  },
  {
    name: "Thandiwe Moyo",
    role: "Fitness Coach",
    location: "Johannesburg, South Africa",
    rating: 5,
    content: "Building my fitness community here has been incredible. The subscription model provides steady income while I help people achieve their health goals.",
    initials: "TM"
  },
  {
    name: "Omar Ibrahim",
    role: "Tech Educator",
    location: "Cairo, Egypt",
    rating: 5,
    content: "As a coding instructor, this platform allows me to sell my courses and offer premium mentorship. The payment options work perfectly for my international students too.",
    initials: "OI"
  }
];

export function Testimonials() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="mb-4">What Creators Are Saying</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of African creators who are successfully monetizing their passion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="p-6 shadow-custom-md hover:shadow-custom-lg transition-smooth gradient-card"
            >
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="h-4 w-4 fill-accent text-accent" 
                  />
                ))}
              </div>

              <p className="text-muted-foreground italic">
                "{testimonial.content}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
