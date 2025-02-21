import { NavBar } from "@/components/ui/tubelight-navbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { WebhookSettings } from "@/components/settings/WebhookSettings";
import { ServiceCategoriesSettings } from "@/components/settings/ServiceCategoriesSettings";
import { AIInstructionsForm } from "@/components/settings/AIInstructionsForm";
import { TeammateSettings } from "@/components/settings/TeammateSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { LogoUpload } from "@/components/settings/LogoUpload";
import { BrandingSettings } from "@/components/settings/BrandingSettings";
import { TranslationSettings } from "@/components/settings/TranslationSettings";
import { AdminSettings } from "@/components/settings/AdminSettings";
import { SettingsMenuItem } from "@/components/settings/SettingsMenuItem";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { BrandingColors } from "@/types/settings";
import { 
  Building2,
  Users,
  CreditCard,
  Palette,
  Calculator,
  Bot,
  Grid,
  Webhook,
  Globe2,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  Users2,
  Settings as SettingsIcon
} from "lucide-react";
import { AIRateForm } from "@/components/settings/AIRateForm";
import { EstimateTemplateSettings } from "@/components/settings/EstimateTemplateSettings";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("business");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const navItems = [
    { name: t("Dashboard"), url: "/dashboard", icon: LayoutDashboard },
    { name: t("Leads"), url: "/leads", icon: Users2 },
    { name: t("Settings"), url: "/settings", icon: SettingsIcon }
  ];

  const { data: contractor, isLoading: contractorLoading } = useQuery({
    queryKey: ["contractor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("contractors")
        .select(`
          *,
          contractor_settings!contractor_settings_id_fkey (*)
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Transform the data to ensure contractor_settings is a single object
      return {
        ...data,
        contractor_settings: data.contractor_settings ? data.contractor_settings[0] : null
      };
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error: contractorError } = await supabase
        .from("contractors")
        .update({
          business_name: formData.businessName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone,
          business_address: formData.businessAddress,
          website: formData.website,
          license_number: formData.licenseNumber,
        })
        .eq("id", user.id);

      if (contractorError) throw contractorError;

      const { error: settingsError } = await supabase
        .from("contractor_settings")
        .update({
          minimum_project_cost: formData.minimumProjectCost,
          markup_percentage: formData.markupPercentage,
          tax_rate: formData.taxRate,
        })
        .eq("id", user.id);

      if (settingsError) throw settingsError;
    },
    onSuccess: () => {
      toast({
        title: t("Settings saved"),
        description: t("Your settings have been updated successfully."),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("Error"),
        description: t("Failed to save settings. Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate("/");
      toast({
        title: t("Logged out successfully"),
        description: t("You have been logged out of your account."),
      });
    } catch (error: any) {
      toast({
        title: t("Error"),
        description: t("Failed to log out. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleUpdateBrandingColors = async (colors: BrandingColors) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from('contractors')
        .update({ branding_colors: colors })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t("Branding colors updated"),
        description: t("Your brand colors have been saved successfully."),
      });
    } catch (error) {
      console.error('Error updating branding colors:', error);
      toast({
        title: t("Error"),
        description: t("Failed to update branding colors. Please try again."),
        variant: "destructive",
      });
    }
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    if (isMobile) {
      setIsDialogOpen(true);
    }
  };

  const isAdmin = contractor?.contact_email === "cairlbrandon@gmail.com" || 
                 contractor?.contact_email === "brandon@reliablepro.net";

  if (contractorLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <NavBar items={navItems} />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">{t("Loading settings...")}</div>
          </div>
        </div>
      </div>
    );
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case "business": return t("Business Information");
      case "team": return t("Team Members");
      case "subscription": return t("Subscription");
      case "branding": return t("Branding");
      case "estimate": return t("Estimate Settings");
      case "ai": return t("AI Preferences");
      case "categories": return t("Service Categories");
      case "webhooks": return t("Webhooks");
      case "translation": return t("Language & Translation");
      case "admin": return t("Admin Settings");
      default: return "";
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "business":
        return (
          <div className="space-y-4">
            <LogoUpload currentLogo={contractor?.business_logo_url} />
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              updateSettings.mutate(data);
            }} className="space-y-2">
              <Input
                label={t("Business Name")}
                name="businessName"
                defaultValue={contractor?.business_name}
                required
              />
              <Input
                label={t("Contact Email")}
                name="contactEmail"
                type="email"
                defaultValue={contractor?.contact_email}
                required
              />
              <Input
                label={t("Contact Phone")}
                name="contactPhone"
                type="tel"
                defaultValue={contractor?.contact_phone}
              />
              <Input
                label={t("Business Address")}
                name="businessAddress"
                defaultValue={contractor?.business_address}
              />
              <Input
                label={t("Website")}
                name="website"
                type="url"
                defaultValue={contractor?.website}
              />
              <Input
                label={t("License Number")}
                name="licenseNumber"
                defaultValue={contractor?.license_number}
              />
              <Button type="submit" className="w-full mt-4" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? t("Saving...") : t("Save Changes")}
              </Button>
            </form>
          </div>
        );
      case "team":
        return <TeammateSettings />;
      case "subscription":
        return <SubscriptionSettings />;
      case "branding":
        return (
          <BrandingSettings 
            initialColors={contractor?.branding_colors as BrandingColors || { primary: "#6366F1", secondary: "#4F46E5" }}
            onSave={handleUpdateBrandingColors}
          />
        );
      case "estimate":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">{t("Estimate Configuration")}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("Configure your pricing settings, including minimum project costs, markup percentages, and tax rates.")}
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              updateSettings.mutate(data);
            }} className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t("Minimum Project Cost ($)")}</label>
                <Input
                  name="minimumProjectCost"
                  type="number"
                  defaultValue={contractor?.contractor_settings?.minimum_project_cost}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("The minimum cost you're willing to take on for any project")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">{t("Markup Percentage (%)")}</label>
                <Input
                  name="markupPercentage"
                  type="number"
                  defaultValue={contractor?.contractor_settings?.markup_percentage}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("This markup is automatically applied to all AI-generated estimates")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">{t("Tax Rate (%)")}</label>
                <Input
                  name="taxRate"
                  type="number"
                  defaultValue={contractor?.contractor_settings?.tax_rate}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("Local tax rate automatically applied to all estimates")}
                </p>
              </div>
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? t("Saving...") : t("Save Changes")}
              </Button>
            </form>

            <div className="pt-6 border-t">
              <EstimateTemplateSettings />
            </div>
          </div>
        );
      case "ai":
        return (
          <div className="space-y-6">
            <AIInstructionsForm
              instructions={contractor?.contractor_settings?.ai_instructions ? 
                JSON.parse(contractor.contractor_settings.ai_instructions) : []}
              onSave={(instructions) => {
                updateSettings.mutate({
                  aiInstructions: instructions
                });
              }}
            />
            <AIRateForm
              rates={[]}
              onSave={() => {}}
            />
          </div>
        );
      case "categories":
        return <ServiceCategoriesSettings />;
      case "webhooks":
        return <WebhookSettings />;
      case "translation":
        return <TranslationSettings />;
      case "admin":
        return isAdmin ? <AdminSettings /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar items={navItems} />
      <div className="container mx-auto py-8 min-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{t("Settings")}</h1>
        </div>
        
        <div className="flex gap-6">
          <div className="w-80 space-y-2 flex-shrink-0">
            <SettingsMenuItem
              icon={<Building2 className="h-5 w-5" />}
              title={t("Business Information")}
              description={t("Update your business details and contact information")}
              onClick={() => handleSectionChange("business")}
              isActive={activeSection === "business"}
            />
            <SettingsMenuItem
              icon={<Users className="h-5 w-5" />}
              title={t("Team Members")}
              description={t("Manage your team members and their access")}
              onClick={() => handleSectionChange("team")}
              isActive={activeSection === "team"}
            />
            <SettingsMenuItem
              icon={<CreditCard className="h-5 w-5" />}
              title={t("Subscription")}
              description={t("Manage your subscription and billing")}
              onClick={() => handleSectionChange("subscription")}
              isActive={activeSection === "subscription"}
            />
            <SettingsMenuItem
              icon={<Palette className="h-5 w-5" />}
              title={t("Branding")}
              description={t("Customize your brand colors and appearance")}
              onClick={() => handleSectionChange("branding")}
              isActive={activeSection === "branding"}
            />
            <SettingsMenuItem
              icon={<Calculator className="h-5 w-5" />}
              title={t("Estimate Settings")}
              description={t("Configure your pricing and cost calculations")}
              onClick={() => handleSectionChange("estimate")}
              isActive={activeSection === "estimate"}
            />
            <SettingsMenuItem
              icon={<Bot className="h-5 w-5" />}
              title={t("AI Preferences")}
              description={t("Configure how AI generates estimates and manages rates")}
              onClick={() => handleSectionChange("ai")}
              isActive={activeSection === "ai"}
            />
            <SettingsMenuItem
              icon={<Grid className="h-5 w-5" />}
              title={t("Service Categories")}
              description={t("Select which services you offer and customize your estimate workflow")}
              onClick={() => handleSectionChange("categories")}
              isActive={activeSection === "categories"}
            />
            <SettingsMenuItem
              icon={<Webhook className="h-5 w-5" />}
              title={t("Webhooks")}
              description={t("Configure external integrations and automation")}
              onClick={() => handleSectionChange("webhooks")}
              isActive={activeSection === "webhooks"}
            />
            <SettingsMenuItem
              icon={<Globe2 className="h-5 w-5" />}
              title={t("Language & Translation")}
              description={t("Configure your language preferences and translations")}
              onClick={() => handleSectionChange("translation")}
              isActive={activeSection === "translation"}
            />
            {isAdmin && (
              <SettingsMenuItem
                icon={<ShieldAlert className="h-5 w-5" />}
                title={t("Admin Settings")}
                description={t("Access administrative functions and data")}
                onClick={() => handleSectionChange("admin")}
                isActive={activeSection === "admin"}
              />
            )}
            <SettingsMenuItem
              icon={<LogOut className="h-5 w-5" />}
              title={t("Log Out")}
              description={t("Sign out of your account")}
              onClick={handleLogout}
            />
          </div>
          
          {isMobile ? (
            <SettingsDialog
              title={getSectionTitle()}
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
            >
              {renderContent()}
            </SettingsDialog>
          ) : (
            <div className="flex-1 bg-background rounded-lg border p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
