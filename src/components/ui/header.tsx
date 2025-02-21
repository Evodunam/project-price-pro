
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function Header1() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // First check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only fetch contractor data if authenticated
  const { data: contractor } = useQuery({
    queryKey: ["contractor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated // Only run query if authenticated
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl font-bold text-primary">EstimateAI</h1>
          </motion.div>
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/signup")}
                  variant="outline"
                  className="text-gray-800 hover:text-gray-600"
                >
                  Sign Up
                </Button>
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="text-gray-800 hover:text-gray-600"
                >
                  Sign In
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="text-gray-800 hover:text-gray-600"
              >
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
