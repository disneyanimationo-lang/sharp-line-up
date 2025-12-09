import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  ArrowLeft, Clock, Scissors, Loader2, CalendarIcon, 
  CreditCard, Wallet, Receipt, Crown, Zap, Star 
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShopReviews from './ShopReviews';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface Shop {
  id: string;
  name: string;
  current_queue?: number;
  rating?: number;
}

interface AppointmentBookingProps {
  shop: Shop;
  onSuccess: (appointmentData: any) => void;
  onBack: () => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const PAYMENT_OPTIONS = [
  { value: 'pay_now', label: 'Pay Now', icon: CreditCard, description: 'Pay online instantly (mock)' },
  { value: 'pay_at_shop', label: 'Pay at Shop', icon: Wallet, description: 'Pay when you arrive' },
  { value: 'pay_after_service', label: 'Pay After Service', icon: Receipt, description: 'Pay after your service is complete' },
];

const PRIORITY_OPTIONS = [
  { value: 'regular', label: 'Regular', icon: Star, description: 'Standard booking', color: 'bg-muted' },
  { value: 'emergency', label: 'Emergency', icon: Zap, description: 'Wedding, Interview (same day priority)', color: 'bg-amber-500/20 text-amber-500', extra: '+₹100' },
];

const AppointmentBooking = ({ shop, onSuccess, onBack }: AppointmentBookingProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [paymentOption, setPaymentOption] = useState('pay_at_shop');
  const [priorityType, setPriorityType] = useState('regular');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [loyaltyInfo, setLoyaltyInfo] = useState<{ visit_count: number; is_vip: boolean } | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to book an appointment');
      navigate('/auth');
      return;
    }
    loadServices();
    loadLoyaltyInfo();
  }, [shop.id, user]);

  useEffect(() => {
    if (selectedDate) {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadServices = async () => {
    setLoading(true);
    try {
      // First get shop_services, then get the actual service details
      const { data: shopServices, error: shopError } = await supabase
        .from('shop_services')
        .select('service_id, custom_price, custom_duration')
        .eq('shop_id', shop.id);

      if (shopError) throw shopError;

      if (shopServices && shopServices.length > 0) {
        const serviceIds = shopServices.map(ss => ss.service_id);
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds);

        if (servicesError) throw servicesError;

        // Merge custom prices/durations
        const mergedServices = servicesData?.map(service => {
          const shopService = shopServices.find(ss => ss.service_id === service.id);
          return {
            ...service,
            price: shopService?.custom_price || service.price,
            duration: shopService?.custom_duration || service.duration,
          };
        }) || [];

        setServices(mergedServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    }
    setLoading(false);
  };

  const loadLoyaltyInfo = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select('visit_count, is_vip')
        .eq('user_id', user.id)
        .eq('shop_id', shop.id)
        .maybeSingle();

      if (!error && data) {
        setLoyaltyInfo(data);
      }
    } catch (error) {
      console.error('Error loading loyalty info:', error);
    }
  };

  const loadBookedSlots = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('shop_id', shop.id)
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (!error && data) {
        setBookedSlots(data.map(a => a.appointment_time.slice(0, 5)));
      }
    } catch (error) {
      console.error('Error loading booked slots:', error);
    }
  };

  const handleServiceToggle = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, service) => sum + service.duration, 0);
  };

  const getTotalPrice = () => {
    let total = selectedServices.reduce((sum, service) => sum + Number(service.price), 0);
    if (priorityType === 'emergency') total += 100;
    return total;
  };

  const getPriorityLevel = () => {
    if (loyaltyInfo?.is_vip) return 'vip';
    if (priorityType === 'emergency') return 'emergency';
    if (loyaltyInfo && loyaltyInfo.visit_count >= 5) return 'loyalty';
    return 'regular';
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error('Please sign in to book');
      navigate('/auth');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    setBooking(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const actualPriority = getPriorityLevel();

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          shop_id: shop.id,
          user_id: user.id,
          customer_name: user.name || user.email,
          appointment_date: dateStr,
          appointment_time: selectedTime + ':00',
          payment_preference: paymentOption as 'pay_now' | 'pay_at_shop' | 'pay_after_service',
          priority_type: actualPriority as 'regular' | 'loyalty' | 'emergency' | 'vip',
          emergency_reason: priorityType === 'emergency' ? emergencyReason : null,
          total_price: getTotalPrice(),
          status: 'scheduled',
          payment_status: paymentOption === 'pay_now' ? 'paid' : 'pending',
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Add appointment services
      const appointmentServices = selectedServices.map(service => ({
        appointment_id: appointment.id,
        service_id: service.id,
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServices);

      if (servicesError) throw servicesError;

      toast.success('Appointment booked successfully!');
      onSuccess({
        ...appointment,
        services: selectedServices,
        shop_name: shop.name,
      });
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      if (error.code === '23505') {
        toast.error('This time slot is no longer available. Please choose another.');
        if (selectedDate) loadBookedSlots(selectedDate);
      } else {
        toast.error('Failed to book appointment. Please try again.');
      }
    }

    setBooking(false);
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{shop.name}</h1>
            {loyaltyInfo?.is_vip && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black">
                <Crown className="w-3 h-3 mr-1" />
                VIP Member
              </Badge>
            )}
          </div>
          <p className="text-xl text-muted-foreground">Book an appointment</p>
          {loyaltyInfo && !loyaltyInfo.is_vip && (
            <p className="text-sm text-muted-foreground mt-1">
              <Star className="w-4 h-4 inline mr-1 text-primary" />
              {loyaltyInfo.visit_count} visits • {10 - loyaltyInfo.visit_count} more for VIP status
            </p>
          )}
        </div>

        {/* Reviews */}
        <div className="mb-8">
          <ShopReviews shopId={shop.id} shopRating={shop.rating || 4.5} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Service Selection */}
            <div>
              <h2 className="text-2xl font-bold mb-4">1. Select Services</h2>
              <div className="grid gap-4">
                {services.map((service) => {
                  const isSelected = selectedServices.some(s => s.id === service.id);
                  return (
                    <Card 
                      key={service.id}
                      className={cn(
                        "p-6 cursor-pointer transition-all duration-300",
                        isSelected 
                          ? 'bg-primary/10 border-primary shadow-lg' 
                          : 'bg-card border-border hover:border-primary/50'
                      )}
                      onClick={() => handleServiceToggle(service)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={cn(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center",
                              isSelected ? 'border-primary bg-primary' : 'border-border'
                            )}>
                              {isSelected && <span className="text-primary-foreground text-sm">✓</span>}
                            </div>
                            <h3 className="text-xl font-bold">{service.name}</h3>
                          </div>
                          {service.description && (
                            <p className="text-muted-foreground mb-3 ml-9">{service.description}</p>
                          )}
                          <div className="flex items-center gap-6 ml-9">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{service.duration} min</span>
                            </div>
                            <div className="text-primary font-bold text-lg">₹{service.price}</div>
                          </div>
                        </div>
                        <Scissors className={cn("w-6 h-6", isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Selection */}
            {selectedServices.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">2. Choose Date & Time</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                      className="pointer-events-auto"
                    />
                  </Card>

                  {selectedDate && (
                    <Card className="p-4">
                      <h3 className="font-semibold mb-4">Available Times for {format(selectedDate, 'PPP')}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => {
                          const isBooked = bookedSlots.includes(time);
                          const isSelected = selectedTime === time;
                          return (
                            <Button
                              key={time}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "h-12",
                                isBooked && "opacity-50 cursor-not-allowed line-through"
                              )}
                              disabled={isBooked}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Priority Selection */}
            {selectedServices.length > 0 && selectedDate && selectedTime && (
              <div>
                <h2 className="text-2xl font-bold mb-4">3. Priority Type</h2>
                <Card className="p-6">
                  {loyaltyInfo?.is_vip ? (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/20 to-yellow-400/20 rounded-lg border border-amber-500/30">
                      <Crown className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="font-bold text-amber-500">VIP Priority Active</p>
                        <p className="text-sm text-muted-foreground">You'll skip the regular queue automatically</p>
                      </div>
                    </div>
                  ) : (
                    <RadioGroup value={priorityType} onValueChange={setPriorityType} className="space-y-3">
                      {PRIORITY_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-3">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <option.icon className="w-5 h-5" />
                              <span className="font-medium">{option.label}</span>
                              {option.extra && (
                                <Badge variant="secondary" className={option.color}>{option.extra}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {priorityType === 'emergency' && (
                    <div className="mt-4">
                      <Label>Reason (optional)</Label>
                      <input
                        type="text"
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        placeholder="e.g., Wedding, Job Interview"
                        className="w-full mt-2 p-3 rounded-lg border border-border bg-background"
                      />
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Payment Selection */}
            {selectedServices.length > 0 && selectedDate && selectedTime && (
              <div>
                <h2 className="text-2xl font-bold mb-4">4. Payment Option</h2>
                <Card className="p-6">
                  <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-3">
                    {PAYMENT_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <RadioGroupItem value={option.value} id={`payment-${option.value}`} />
                        <Label htmlFor={`payment-${option.value}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <option.icon className="w-5 h-5" />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Card>
              </div>
            )}

            {/* Booking Summary */}
            {selectedServices.length > 0 && selectedDate && selectedTime && (
              <div className="sticky bottom-6">
                <Card className="p-6 bg-card border-border shadow-lg">
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="font-semibold">{format(selectedDate, 'PPP')}</p>
                          <p className="text-lg font-bold text-primary">{selectedTime}</p>
                        </div>
                        <Badge className={cn(
                          getPriorityLevel() === 'vip' && 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black',
                          getPriorityLevel() === 'emergency' && 'bg-amber-500',
                          getPriorityLevel() === 'loyalty' && 'bg-green-500',
                        )}>
                          {getPriorityLevel() === 'vip' && <Crown className="w-3 h-3 mr-1" />}
                          {getPriorityLevel().charAt(0).toUpperCase() + getPriorityLevel().slice(1)} Priority
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        {selectedServices.map(service => (
                          <div key={service.id} className="flex justify-between items-center">
                            <span>{service.name}</span>
                            <span className="text-sm text-muted-foreground">₹{service.price}</span>
                          </div>
                        ))}
                        {priorityType === 'emergency' && (
                          <div className="flex justify-between items-center text-amber-500">
                            <span>Emergency Priority</span>
                            <span>+₹100</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                        <div>
                          <p className="text-sm text-muted-foreground">Duration: {getTotalDuration()} min</p>
                          <p className="text-sm text-muted-foreground">
                            Payment: {PAYMENT_OPTIONS.find(p => p.value === paymentOption)?.label}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">₹{getTotalPrice()}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={booking}
                    >
                      {booking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="w-5 h-5 mr-2" />
                          Confirm Appointment
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;
