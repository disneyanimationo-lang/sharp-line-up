import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, Scissors, Loader2, CreditCard, Wallet, Receipt, Crown, Zap, Star } from 'lucide-react';
import { getShopServices, joinQueue } from '@/services/mockQueueApi';
import { getActiveQueue } from '@/services/mockActiveQueueApi';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useMockAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShopReviews from './ShopReviews';
import QueueRestrictionBanner from './QueueRestrictionBanner';
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS = [
  { value: 'pay_now', label: 'Pay Now', icon: CreditCard, description: 'Pay online instantly (mock)' },
  { value: 'pay_at_shop', label: 'Pay at Shop', icon: Wallet, description: 'Pay when you arrive' },
  { value: 'pay_after_service', label: 'Pay After Service', icon: Receipt, description: 'Pay after your service is complete' },
];

const PRIORITY_OPTIONS = [
  { value: 'regular', label: 'Regular', icon: Star, description: 'Standard queue position', color: 'bg-muted' },
  { value: 'emergency', label: 'Emergency', icon: Zap, description: 'Wedding, Interview (same day priority)', color: 'bg-amber-500/20 text-amber-500', extra: '+₹100' },
];

const ServiceSelection = ({ shop, onServiceSelect, onBack }: any) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [existingQueue, setExistingQueue] = useState<any>(null);
  const [paymentOption, setPaymentOption] = useState('pay_at_shop');
  const [priorityType, setPriorityType] = useState('regular');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [loyaltyInfo, setLoyaltyInfo] = useState<{ visit_count: number; is_vip: boolean } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Require authentication
    if (!user) {
      toast.error('Please sign in to join a queue');
      navigate('/auth');
      return;
    }
    
    loadServices();
    loadUserProfile();
    checkExistingQueue();
    loadLoyaltyInfo();
  }, [shop.id, user]);

  const loadUserProfile = async () => {
    if (!user) return;
    setCustomerName(user.name || user.email);
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

  const checkExistingQueue = async () => {
    if (!user) return;
    
    const userName = user.name || user.email;
    const { data: queueData } = await getActiveQueue(userName);
    if (queueData && queueData.shop_id !== shop.id) {
      setExistingQueue(queueData);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    const { data, error } = await getShopServices(shop.id);
    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const handleServiceToggle = (service: any) => {
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
    let total = selectedServices.reduce((sum, service) => sum + service.price, 0);
    if (priorityType === 'emergency') total += 100;
    return total;
  };

  const getPriorityLevel = () => {
    if (loyaltyInfo?.is_vip) return 'vip';
    if (priorityType === 'emergency') return 'emergency';
    if (loyaltyInfo && loyaltyInfo.visit_count >= 5) return 'loyalty';
    return 'regular';
  };

  const handleJoinQueue = async () => {
    if (!user) {
      toast.error('Please sign in to join a queue');
      navigate('/auth');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Unable to load your profile. Please try again.');
      return;
    }

    setJoining(true);
    const serviceIds = selectedServices.map(s => s.id);
    const { data, error } = await joinQueue(
      shop.id,
      serviceIds,
      customerName.trim(),
      user.id
    );
    setJoining(false);

    if (error) {
      // Show more detailed error for existing queue
      if (error.includes('already have an active queue')) {
        toast.error(error, {
          duration: 5000,
        });
      } else {
        toast.error(error);
      }
      return;
    }

    toast.success('Successfully joined the queue!');
    onServiceSelect(selectedServices, data);
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
          Back
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
          <p className="text-xl text-muted-foreground">Select services to join the queue</p>
          {loyaltyInfo && !loyaltyInfo.is_vip && (
            <p className="text-sm text-muted-foreground mt-1">
              <Star className="w-4 h-4 inline mr-1 text-primary" />
              {loyaltyInfo.visit_count} visits • {10 - loyaltyInfo.visit_count} more for VIP status
            </p>
          )}
        </div>

        {/* Queue Restriction Warning */}
        {existingQueue && (
          <QueueRestrictionBanner shopName={existingQueue.shops?.name || 'another shop'} />
        )}

        {/* Reviews Section */}
        <div className="mb-8">
          <ShopReviews shopId={shop.id} shopRating={shop.rating || 4.5} />
        </div>

        {/* Service Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-8">
              {services.map((service) => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                  <Card 
                    key={service.id}
                    className={`p-6 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-lg' 
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleServiceToggle(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-border'
                          }`}>
                            {isSelected && (
                              <div className="w-3 h-3 text-primary-foreground">✓</div>
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
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Priority Selection */}
            {selectedServices.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Priority Type</h2>
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
                          <RadioGroupItem value={option.value} id={`queue-${option.value}`} />
                          <Label htmlFor={`queue-${option.value}`} className="flex-1 cursor-pointer">
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
            {selectedServices.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4">Payment Option</h2>
                <Card className="p-6">
                  <RadioGroup value={paymentOption} onValueChange={setPaymentOption} className="space-y-3">
                    {PAYMENT_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <RadioGroupItem value={option.value} id={`queue-payment-${option.value}`} />
                        <Label htmlFor={`queue-payment-${option.value}`} className="flex-1 cursor-pointer">
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

            {/* Confirm Section */}
            {selectedServices.length > 0 && (
              <div className="sticky bottom-6 bg-card border border-border rounded-lg p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-muted-foreground">Selected Services ({selectedServices.length})</p>
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
                          <span className="font-semibold">{service.name}</span>
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
                        <p className="text-sm text-muted-foreground">Total Duration: {getTotalDuration()} min</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated wait: ~{shop.currentQueue * getTotalDuration()} minutes
                        </p>
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
                    onClick={handleJoinQueue}
                    className="w-full py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={joining || !!existingQueue}
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining Queue...
                      </>
                    ) : existingQueue ? (
                      'Already in Another Queue'
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
