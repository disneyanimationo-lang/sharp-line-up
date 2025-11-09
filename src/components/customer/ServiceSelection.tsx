import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Scissors, Loader2 } from 'lucide-react';
import { getShopServices, joinQueue } from '@/services/queueApi';
import { toast } from 'sonner';

const ServiceSelection = ({ shop, onServiceSelect, onBack }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadServices();
  }, [shop.id]);

  const loadServices = async () => {
    setLoading(true);
    const { data, error } = await getShopServices(shop.id);
    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleJoinQueue = async () => {
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setJoining(true);
    const { data, error } = await joinQueue(
      shop.id,
      selectedService.id,
      customerName.trim()
    );
    setJoining(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success('Successfully joined the queue!');
    onServiceSelect(selectedService, data);
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {services.map((service) => (
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
                          ₹{service.price}
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

            {/* Confirm Section */}
            {selectedService && (
              <div className="sticky bottom-6 bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Selected Service:</p>
                    <p className="font-semibold text-lg">{selectedService.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated wait: ~{shop.currentQueue * selectedService.duration} minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Your Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={joining}
                    />
                  </div>

                  <Button
                    onClick={handleJoinQueue}
                    className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={joining}
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining Queue...
                      </>
                    ) : (
                      'Join Queue'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;
