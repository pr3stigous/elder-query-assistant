
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface UserPanelProps {
  user: any;
  onSignOut?: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ user, onSignOut }) => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      if (onSignOut) onSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex items-center">
      <span className="text-sm mr-2">Signed in as {user.email}</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleSignOut}
      >
        Sign out
      </Button>
    </div>
  );
};

export default UserPanel;
