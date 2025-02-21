
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EstimateDisplay } from "@/components/EstimateForm/EstimateDisplay";
import { LoadingScreen } from "@/components/EstimateForm/LoadingScreen";
import { Database } from "@/integrations/supabase/types";
import { useEffect } from "react";
import { BrandingColors } from "@/types/settings";

type EstimateData = {
  groups: Array<{
    name: string;
    description?: string;
    subgroups: Array<{
      name: string;
      items: Array<{
        title: string;
        description?: string;
        quantity: number;
        unit?: string;
        unitAmount: number;
        totalPrice: number;
      }>;
      subtotal: number;
    }>;
  }>;
};

type ContractorWithSettings = Database["public"]["Tables"]["contractors"]["Row"] & {
  contractor_settings: Database["public"]["Tables"]["contractor_settings"]["Row"];
};

const DEFAULT_CONTRACTOR_ID = "098bcb69-99c6-445b-bf02-94dc7ef8c938";

const PublicEstimate = () => {
  const { id } = useParams();

  const { data: lead } = useQuery({
    queryKey: ["public-estimate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          contractors (
            id,
            business_name,
            business_logo_url,
            contact_email,
            contact_phone,
            business_address,
            website,
            license_number,
            subscription_status,
            branding_colors,
            created_at,
            updated_at,
            contractor_settings (*)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        return {
          id,
          contractor_id: DEFAULT_CONTRACTOR_ID,
          estimate_data: null,
          estimated_cost: 0,
          project_title: "New Estimate",
          project_description: "",
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
    },
  });

  const { data: contractor, isLoading: isContractorLoading } = useQuery({
    queryKey: ["contractor", lead?.contractor_id || DEFAULT_CONTRACTOR_ID],
    queryFn: async () => {
      const contractorId = lead?.contractor_id || DEFAULT_CONTRACTOR_ID;
      const { data, error } = await supabase
        .from("contractors")
        .select(`
          *,
          contractor_settings!contractor_settings_id_fkey (*)
        `)
        .eq("id", contractorId)
        .maybeSingle();

      if (error) throw error;
      
      // Transform the data to ensure contractor_settings is a single object
      return {
        ...data,
        contractor_settings: data.contractor_settings ? data.contractor_settings[0] : null
      };
    },
    enabled: !!lead,
    staleTime: 5 * 60 * 1000,
  });

  // Apply branding colors when contractor data is loaded
  useEffect(() => {
    if (contractor?.branding_colors) {
      const colors = contractor.branding_colors as BrandingColors;
      
      // Apply primary color and its variations
      document.documentElement.style.setProperty('--primary', colors.primary);
      document.documentElement.style.setProperty('--primary-foreground', '#FFFFFF');

      // Convert hex to RGB for creating variations
      const primaryHex = colors.primary.replace('#', '');
      const r = parseInt(primaryHex.slice(0, 2), 16);
      const g = parseInt(primaryHex.slice(2, 4), 16);
      const b = parseInt(primaryHex.slice(4, 6), 16);

      // Set all primary color variations
      document.documentElement.style.setProperty('--primary-100', `rgba(${r}, ${g}, ${b}, 0.1)`);
      document.documentElement.style.setProperty('--primary-200', `rgba(${r}, ${g}, ${b}, 0.2)`);
      document.documentElement.style.setProperty('--primary-300', `rgba(${r}, ${g}, ${b}, 0.4)`);
      document.documentElement.style.setProperty('--primary-400', `rgba(${r}, ${g}, ${b}, 0.6)`);
      document.documentElement.style.setProperty('--primary-500', `rgba(${r}, ${g}, ${b}, 0.8)`);
      document.documentElement.style.setProperty('--primary-600', colors.primary);
      document.documentElement.style.setProperty('--primary-700', `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 1)`);

      // Set secondary color
      document.documentElement.style.setProperty('--secondary', colors.secondary);
      document.documentElement.style.setProperty('--secondary-foreground', '#1d1d1f');
    }
  }, [contractor]);

  if (isContractorLoading) {
    return <LoadingScreen message="Loading estimate..." />;
  }

  if (!contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Estimate Not Found</h1>
          <p className="text-muted-foreground">
            The estimate you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const estimateData = lead?.estimate_data as EstimateData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <EstimateDisplay
          groups={estimateData?.groups || []}
          totalCost={lead?.estimated_cost || 0}
          projectSummary={lead?.project_description}
          contractor={{
            business_name: contractor?.business_name,
            business_logo_url: contractor?.business_logo_url || undefined,
            branding_colors: contractor?.branding_colors as { primary: string; secondary: string } || undefined
          }}
        />
      </div>
    </div>
  );
};

export default PublicEstimate;
