
import { Button } from "@/components/ui/3d-button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Boxes } from "@/components/ui/background-boxes";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if contractor exists before redirecting
        const { data: contractor } = await supabase
          .from("contractors")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (contractor) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const validateForm = () => {
    if (!email || (!isForgotPassword && !password)) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (!isForgotPassword && password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (isSignUp && (!firstName || !lastName)) {
      toast({
        title: "Missing Fields",
        description: "Please provide both first and last name.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const response = await supabase.functions.invoke('send-password-reset', {
        body: { email, resetUrl },
      });

      if (response.error) throw response.error;

      toast({
        title: "Check your email",
        description: "If an account exists with this email, you will receive password reset instructions.",
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isSignUp) {
        // Handle sign up
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account.",
        });
        
        // Always navigate to onboarding for new users
        navigate("/onboarding");
      } else {
        // Handle sign in
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check if user has a contractor record
        const { data: contractor, error: contractorError } = await supabase
          .from("contractors")
          .select("*")
          .eq("id", signInData.session?.user.id)
          .maybeSingle();

        if (contractorError) throw contractorError;

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        // Navigate based on whether the user has completed onboarding
        if (contractor) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Error",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-black z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none opacity-90" />
      <Boxes className="!opacity-10 filter contrast-150 saturate-0" />
      
      <Card className="w-full max-w-md p-8 relative z-30 bg-white/10 backdrop-blur-xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            {isForgotPassword 
              ? "Reset Password"
              : isSignUp 
                ? "Create Account" 
                : "Welcome Back"}
          </h1>
          <p className="mt-2 text-gray-400">
            {isForgotPassword
              ? "Enter your email to receive reset instructions"
              : isSignUp
                ? "Sign up to start estimating projects"
                : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
          {isSignUp && !isForgotPassword && (
            <>
              <Input
                label="First Name"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                label="Last Name"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </>
          )}
          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/10 text-white"
          />
          {!isForgotPassword && (
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/5 border-white/10 text-white"
            />
          )}
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : isForgotPassword
                ? "Send Reset Instructions"
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {!isForgotPassword && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
                setFirstName("");
                setLastName("");
              }}
              className="text-gray-400 hover:text-white transition-colors border-none"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(!isForgotPassword);
              setPassword("");
            }}
            className="block w-full text-gray-400 hover:text-white transition-colors border-none"
          >
            {isForgotPassword
              ? "Back to login"
              : "Forgot your password?"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
