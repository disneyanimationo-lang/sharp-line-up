import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, User } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to CutQueue
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose how you'd like to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-primary" onClick={() => navigate("/customer")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-primary/10 flex items-center justify-center">
                <User className="w-10 h-10 text-blue-primary" />
              </div>
              <CardTitle className="text-2xl">I'm a Customer</CardTitle>
              <CardDescription className="text-base">
                Find nearby barbershops and join queues
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" className="w-full" onClick={(e) => {
                e.stopPropagation();
                navigate("/customer");
              }}>
                Continue as Customer
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-accent" onClick={() => navigate("/auth")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-blue-accent/10 flex items-center justify-center">
                <Scissors className="w-10 h-10 text-blue-accent" />
              </div>
              <CardTitle className="text-2xl">I'm a Salon Owner</CardTitle>
              <CardDescription className="text-base">
                Manage your shop and customer queues
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button size="lg" variant="secondary" className="w-full" onClick={(e) => {
                e.stopPropagation();
                navigate("/auth");
              }}>
                Continue as Owner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
