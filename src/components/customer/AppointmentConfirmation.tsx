import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CalendarIcon, Clock, MapPin, Crown, Home } from 'lucide-react';
import { format } from 'date-fns';

interface AppointmentConfirmationProps {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    customer_name: string;
    total_price: number;
    priority_type: string;
    payment_preference: string;
    payment_status: string;
    services: Array<{ name: string; duration: number; price: number }>;
    shop_name: string;
  };
  onGoHome: () => void;
}

const AppointmentConfirmation = ({ appointment, onGoHome }: AppointmentConfirmationProps) => {
  const getPaymentLabel = (preference: string) => {
    switch (preference) {
      case 'pay_now': return 'Paid Online';
      case 'pay_at_shop': return 'Pay at Shop';
      case 'pay_after_service': return 'Pay After Service';
      default: return preference;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Appointment Confirmed!</h1>
          <p className="text-muted-foreground">Your appointment has been booked successfully</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{appointment.shop_name}</h2>
              <p className="text-muted-foreground">{appointment.customer_name}</p>
            </div>
            {appointment.priority_type === 'vip' && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
                <Crown className="w-3 h-3 mr-1" />
                VIP
              </Badge>
            )}
          </div>

          <div className="grid gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{appointment.appointment_time.slice(0, 5)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 mb-4">
            <h3 className="font-semibold mb-3">Services</h3>
            <div className="space-y-2">
              {appointment.services.map((service, index) => (
                <div key={index} className="flex justify-between">
                  <span>{service.name}</span>
                  <span className="text-muted-foreground">₹{service.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">₹{appointment.total_price}</p>
            </div>
            <Badge variant="outline">
              {getPaymentLabel(appointment.payment_preference)}
            </Badge>
          </div>
        </Card>

        <div className="space-y-3">
          <Button 
            onClick={onGoHome}
            className="w-full py-6 text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation;
