import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfileSettingsProps {
  onBack: () => void;
}

const ProfileSettings = ({ onBack }: ProfileSettingsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Load profile data
  useState(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(async ({ data, error }) => {
          if (data) {
            setName(data.name || '');
            setAvatarUrl(data.avatar_url || '');
          } else if (!error) {
            // Create profile if it doesn't exist
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({ id: user.id, name: user.email?.split('@')[0] || 'User' })
              .select('name, avatar_url')
              .single();
            
            if (newProfile) {
              setName(newProfile.name || '');
              setAvatarUrl(newProfile.avatar_url || '');
            }
          }
        });
    }
  });

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        name,
        avatar_url: avatarUrl 
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>{name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;