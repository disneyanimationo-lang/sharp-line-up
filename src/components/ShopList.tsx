import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star, Clock, Search } from 'lucide-react';

const mockShops = [
  {
    id: 1,
    name: "Classic Cuts Barbershop",
    address: "123 Main St, Downtown",
    rating: 4.8,
    distance: "0.5 miles",
    waitTime: 15,
    queueLength: 3,
    services: ["Haircut", "Beard Trim", "Hot Towel Shave"]
  },
  {
    id: 2,
    name: "The Gentleman's Parlor",
    address: "456 Oak Ave, Midtown",
    rating: 4.9,
    distance: "1.2 miles",
    waitTime: 25,
    queueLength: 5,
    services: ["Haircut", "Beard Trim", "Hair Styling"]
  },
  {
    id: 3,
    name: "Urban Fade Studio",
    address: "789 Elm St, Uptown",
    rating: 4.7,
    distance: "1.8 miles",
    waitTime: 20,
    queueLength: 4,
    services: ["Haircut", "Fade", "Beard Trim"]
  },
  {
    id: 4,
    name: "Royal Barber Lounge",
    address: "321 Pine Rd, West Side",
    rating: 4.6,
    distance: "2.1 miles",
    waitTime: 30,
    queueLength: 6,
    services: ["Haircut", "Shave", "Hair Treatment"]
  }
];

const ShopList = ({ onShopSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shops] = useState(mockShops);

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find A Barber</h1>
          <p className="text-xl text-muted-foreground">Browse nearby shops and check their queue status</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg bg-card border-border"
          />
        </div>

        {/* Shop Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredShops.map((shop) => (
            <Card key={shop.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">{shop.name}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-semibold">{shop.rating}</span>
                    <span className="text-muted-foreground ml-2">• {shop.distance}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-4 py-4 px-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm text-muted-foreground">Wait Time</div>
                    <div className="font-bold">{shop.waitTime} min</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div>
                  <div className="text-sm text-muted-foreground">In Queue</div>
                  <div className="font-bold">{shop.queueLength} people</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-2">Services:</div>
                <div className="flex flex-wrap gap-2">
                  {shop.services.map((service) => (
                    <span key={service} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => onShopSelect(shop)}
              >
                Join Queue
              </Button>
            </Card>
          ))}
        </div>

        {filteredShops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">No shops found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopList;
