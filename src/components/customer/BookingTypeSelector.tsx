import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Users } from 'lucide-react';

interface BookingTypeSelectorProps {
  shop: {
    id: string;
    name: string;
    current_queue?: number;
  };
  onSelectType: (type: 'queue' | 'appointment') => void;
  onBack: () => void;
}

const BookingTypeSelector = ({ shop, onSelectType, onBack }: BookingTypeSelectorProps) => {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Shops
        </Button>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-xl text-muted-foreground">How would you like to book?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="p-8 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg group"
            onClick={() => onSelectType('queue')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Walk-in Queue</h3>
              <p className="text-muted-foreground mb-4">
                Join the queue now and get served when it's your turn
              </p>
              {shop.current_queue !== undefined && (
                <p className="text-sm text-primary font-medium">
                  {shop.current_queue} people waiting
                </p>
              )}
            </div>
          </Card>

          <Card 
            className="p-8 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg group"
            onClick={() => onSelectType('appointment')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <CalendarDays className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Book Appointment</h3>
              <p className="text-muted-foreground mb-4">
                Schedule a specific date and time that works for you
              </p>
              <p className="text-sm text-primary font-medium">
                Appointments get priority
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingTypeSelector;
