import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users, CheckCircle } from 'lucide-react';

const QueueStatus = ({ position, service, shop, onBack }) => {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [estimatedWait, setEstimatedWait] = useState(position * 20);

  // Simulate queue movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPosition(prev => {
        if (prev > 1) {
          setEstimatedWait(est => Math.max(0, est - 20));
          return prev - 1;
        }
        return prev;
      });
    }, 15000); // Move up every 15 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const getStatusMessage = () => {
    if (currentPosition === 1) {
      return "You're next! Please head to the shop.";
    } else if (currentPosition === 2) {
      return "Almost there! Get ready.";
    } else {
      return `${currentPosition - 1} people ahead of you`;
    }
  };

  const getStatusColor = () => {
    if (currentPosition === 1) return 'text-accent';
    if (currentPosition === 2) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Button 
          variant="ghost" 
          className="mb-6 hover:bg-secondary"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Leave Queue
        </Button>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">You're in the queue!</h1>
          <p className="text-lg text-muted-foreground">{shop.name}</p>
        </div>

        {/* Position Card */}
        <Card className="p-8 mb-6 bg-card border-border text-center">
          <div className="mb-4">
            <div className="text-6xl md:text-8xl font-bold text-primary mb-2">
              #{currentPosition}
            </div>
            <p className={`text-xl ${getStatusColor()}`}>
              {getStatusMessage()}
            </p>
          </div>

          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${((position - currentPosition) / position) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Est. Wait Time</div>
              <div className="text-2xl font-bold">{estimatedWait} min</div>
            </div>
            
            <div className="p-4 bg-secondary/50 rounded-lg">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">In Queue</div>
              <div className="text-2xl font-bold">{currentPosition + Math.floor(Math.random() * 3)}</div>
            </div>
          </div>
        </Card>

        {/* Service Info */}
        <Card className="p-6 mb-6 bg-card border-border">
          <h3 className="font-bold mb-4">Your Service</h3>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold text-lg">{service.name}</div>
              <div className="text-muted-foreground">{service.description}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{service.price}</div>
              <div className="text-sm text-muted-foreground">{service.duration} min</div>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-secondary/30 border-border">
          <h3 className="font-bold mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Keep this page open to track your position in real-time</li>
            <li>• You'll get a notification when it's almost your turn</li>
            <li>• Please arrive at the shop when you're in the top 2</li>
            <li>• If you need to leave, click "Leave Queue" above</li>
          </ul>
        </Card>

        {/* Notification Settings */}
        <div className="mt-6 text-center">
          <Button variant="outline" className="border-border hover:bg-secondary">
            Enable Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;
