import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Scissors } from 'lucide-react';

const mockServices = [
  {
    id: 1,
    name: "Classic Haircut",
    duration: 30,
    price: "$25",
    description: "Traditional haircut with styling"
  },
  {
    id: 2,
    name: "Haircut & Beard Trim",
    duration: 45,
    price: "$35",
    description: "Complete haircut with beard shaping"
  },
  {
    id: 3,
    name: "Beard Trim Only",
    duration: 20,
    price: "$15",
    description: "Professional beard trimming and shaping"
  },
  {
    id: 4,
    name: "Hot Towel Shave",
    duration: 40,
    price: "$30",
    description: "Traditional straight razor shave with hot towels"
  },
  {
    id: 5,
    name: "Kids Haircut",
    duration: 25,
    price: "$20",
    description: "Haircut for children under 12"
  },
  {
    id: 6,
    name: "Premium Package",
    duration: 60,
    price: "$50",
    description: "Haircut, beard trim, hot towel treatment, and styling"
  }
];

const ServiceSelection = ({ shop, onServiceSelect, onBack }) => {
  const [selectedService, setSelectedService] = useState(null);

  const handleConfirm = () => {
    if (selectedService) {
      onServiceSelect(selectedService);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Shops
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-xl text-muted-foreground">Select a service to join the queue</p>
        </div>

        {/* Service Cards */}
        <div className="grid gap-4 mb-8">
          {mockServices.map((service) => (
            <Card 
              key={service.id}
              className={`p-6 cursor-pointer transition-all duration-300 ${
                selectedService?.id === service.id 
                  ? 'bg-primary/10 border-primary shadow-lg' 
                  : 'bg-card border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedService(service)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedService?.id === service.id 
                        ? 'border-primary bg-primary' 
                        : 'border-border'
                    }`}>
                      {selectedService?.id === service.id && (
                        <div className="w-3 h-3 rounded-full bg-primary-foreground"></div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{service.name}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-3 ml-9">{service.description}</p>
                  
                  <div className="flex items-center gap-6 ml-9">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="text-primary font-bold text-lg">
                      {service.price}
                    </div>
                  </div>
                </div>
                
                <Scissors className={`w-6 h-6 ${
                  selectedService?.id === service.id ? 'text-primary' : 'text-muted-foreground'
                }`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="sticky bottom-6 bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Current queue</div>
              <div className="font-bold">{shop.queueLength} people waiting</div>
            </div>
            {selectedService && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Estimated wait</div>
                <div className="font-bold text-primary">
                  ~{shop.waitTime + selectedService.duration} min
                </div>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!selectedService}
            onClick={handleConfirm}
          >
            {selectedService ? `Join Queue - ${selectedService.name}` : 'Select a service'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;
