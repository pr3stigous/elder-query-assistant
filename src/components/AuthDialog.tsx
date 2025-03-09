
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AuthDialogProps {
  onUserChange?: (user: any) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ onUserChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have been signed in successfully",
      });
      setIsOpen(false);
      if (onUserChange) onUserChange(data.user);
    } catch (error) {
      console.error("Login error:", error);
      
      // If user doesn't exist, offer to sign up
      if (error.message.includes("Invalid login credentials")) {
        const shouldSignUp = window.confirm("Account not found. Would you like to create a new account?");
        if (shouldSignUp) {
          handleSignUp();
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid login credentials. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Could not log you in. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Account Created",
        description: "Please check your email for a confirmation link",
      });
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-elder-blue hover:bg-elder-blue-dark text-white"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Sign in to save conversations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSignUp}
              variant="outline"
              disabled={isAuthLoading}
              className="flex-1"
            >
              Sign Up
            </Button>
            <Button
              onClick={handleLogin}
              disabled={isAuthLoading}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
