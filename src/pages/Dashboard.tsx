import { NavBar } from "@/components/ui/tubelight-navbar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Users, Settings, Copy, LineChart, FileText, Bell, History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isCopyingUrl, setIsCopyingUrl] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const navItems = [
    { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", url: "/leads", icon: Users },
    { name: "Settings", url: "/settings", icon: Settings }
  ];

  // First check authentication and contractor status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to access the dashboard",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        setUserId(user.id);
        console.log('Set user ID:', user.id);

        // Check if contractor exists
        const { data: contractor, error: contractorError } = await supabase
          .from("contractors")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (contractorError) {
          console.error('Error checking contractor:', contractorError);
          throw contractorError;
        }

        if (!contractor) {
          console.log('No contractor data found, redirecting to onboarding');
          navigate("/onboarding");
          return;
        }
      } catch (error) {
        console.error('Error in auth check:', error);
        toast({
          title: "Error",
          description: "An error occurred while checking your account status",
          variant: "destructive",
        });
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const { data: contractor, isLoading: isContractorLoading } = useQuery({
    queryKey: ["contractor", userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('Fetching contractor data for ID:', userId);

      const { data, error } = await supabase
        .from("contractors")
        .select("*, contractor_settings(*)")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching contractor:', error);
        throw error;
      }
      
      if (!data) {
        console.log('No contractor data found, redirecting to onboarding');
        navigate("/onboarding");
        return null;
      }
      
      return data;
    },
    enabled: !!userId,
    retry: false,
    meta: {
      errorMessage: "Failed to load contractor data",
    },
  });

  const { data: leads = [], isError: isLeadsError } = useQuery({
    queryKey: ["leads", userId],
    queryFn: async () => {
      if (!userId) {
        console.error('No user ID available for leads query');
        throw new Error("No user ID available");
      }

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!contractor,
    retry: 1,
    meta: {
      errorMessage: "Failed to load leads",
    },
  });

  // Handle query errors with useEffect
  useEffect(() => {
    if (isLeadsError) {
      toast({
        title: "Error",
        description: "Failed to load leads. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [isLeadsError, toast]);

  const copyEstimatorLink = async () => {
    try {
      setIsCopyingUrl(true);
      const baseUrl = window.location.origin;
      const effectiveContractorId = userId;
      if (!effectiveContractorId) {
        throw new Error('No contractor ID available');
      }
      console.log('Using contractor ID for link:', effectiveContractorId);
      const longUrl = `${baseUrl}/estimate/${effectiveContractorId}`;
      
      const { data, error } = await supabase.functions.invoke('shorten-url', {
        body: { 
          longUrl,
          contractorId: effectiveContractorId
        }
      });

      if (error) throw error;
      
      const shortUrl = data.shortURL;
      await navigator.clipboard.writeText(shortUrl);
      
      toast({
        title: "Link copied!",
        description: "The shortened estimator link has been copied to your clipboard.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error shortening URL:', error);
      if (userId) {
        const baseUrl = window.location.origin;
        const longUrl = `${baseUrl}/estimate/${userId}`;
        await navigator.clipboard.writeText(longUrl);
        toast({
          title: "Link copied!",
          description: "The estimator link has been copied to your clipboard.",
          duration: 2000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate link. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCopyingUrl(false);
    }
  };

  if (isContractorLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!contractor) return null;

  const totalLeads = leads.length;
  const totalEstimatedValue = leads.reduce((sum, lead) => sum + (lead.estimated_cost || 0), 0);

  const features = [
    {
      Icon: Copy,
      name: "Preview Estimator",
      description: "Preview your estimator or copy the link to share",
      href: `/estimate/${userId || ''}`,
      cta: "Preview",
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:col-span-3 bg-primary text-white hover:scale-[1.02] transition-transform",
      detailContent: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Estimator Preview</h3>
          <p>View your estimator as your clients will see it, or copy the link to share.</p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => {
                if (!userId) {
                  toast({
                    title: "Error",
                    description: "Unable to preview estimator. Please try logging in again.",
                    variant: "destructive",
                  });
                  return;
                }
                navigate(`/estimate/${userId}`);
              }}
            >
              Open Preview
            </Button>
            <Button 
              variant="outline"
              onClick={copyEstimatorLink}
              disabled={isCopyingUrl || !userId}
            >
              {isCopyingUrl ? "Copying..." : "Copy Link"}
            </Button>
          </div>
        </div>
      ),
      actions: (
        <div className="flex gap-2 mt-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              copyEstimatorLink();
            }}
            disabled={isCopyingUrl || !userId}
            className="text-white hover:text-white/80"
          >
            <Copy className="w-4 h-4 mr-2" />
            {isCopyingUrl ? "Copying..." : "Copy Link"}
          </Button>
        </div>
      ),
    },
    {
      Icon: FileText,
      name: "Total Leads",
      description: `You have ${totalLeads} leads in your pipeline`,
      href: "/leads",
      cta: "View all leads",
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:col-span-1 hover:scale-[1.02] transition-transform",
      detailContent: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Lead Summary</h3>
          <p>Quick overview of your leads pipeline</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Leads:</span>
              <span className="font-semibold">{totalLeads}</span>
            </div>
            <Button onClick={() => navigate('/leads')} className="w-full">
              View All Leads
            </Button>
          </div>
        </div>
      ),
    },
    {
      Icon: LineChart,
      name: "Total Value",
      description: `Total estimated value: $${totalEstimatedValue.toLocaleString()}`,
      href: "/leads",
      cta: "View details",
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:col-span-1 hover:scale-[1.02] transition-transform",
      detailContent: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Pipeline Value</h3>
          <p>Total value of all leads in your pipeline</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Value:</span>
              <span className="font-semibold">${totalEstimatedValue.toLocaleString()}</span>
            </div>
            <Button onClick={() => navigate('/leads')} className="w-full">
              View Details
            </Button>
          </div>
        </div>
      ),
    },
    {
      Icon: History,
      name: "Recent Activity",
      description: "Latest updates and notifications",
      href: "/leads",
      cta: "View all",
      background: <div className="absolute -right-20 -top-20 opacity-60" />,
      className: "lg:col-span-1 hover:scale-[1.02] transition-transform",
      detailContent: (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Activity</h3>
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4 text-primary" />
                <span>{lead.project_title}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate('/leads')} className="w-full">
            View All Activity
          </Button>
        </div>
      ),
      content: (
        <div className="mt-4 space-y-3">
          {leads.slice(0, 3).map((lead) => (
            <div key={lead.id} className="flex items-center gap-2 text-sm text-gray-600">
              <Bell className="w-4 h-4" />
              <span>New lead: {lead.project_title}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f5f5f7]">
        <NavBar items={navItems} />
        
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">
              Welcome, {contractor?.business_name}
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your business performance
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <BentoGrid 
              className={`grid-cols-1 md:grid-cols-3 gap-6 ${isMobile ? 'auto-rows-[16rem]' : ''}`}
            >
              {features.map((feature) => (
                <BentoCard 
                  key={feature.name} 
                  {...feature} 
                  onClick={() => setSelectedFeature(feature.name)}
                  showActions={isMobile}
                  actionIcon={<ChevronRight className="w-4 h-4" />}
                  className={`${feature.className} transform transition-all duration-200 hover:scale-[1.02]`}
                />
              ))}
            </BentoGrid>
          </div>
        </main>
      </div>

      <Dialog 
        open={!!selectedFeature} 
        onOpenChange={(open) => {
          if (!open) setSelectedFeature(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          {selectedFeature ? features.find(f => f.name === selectedFeature)?.detailContent : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
