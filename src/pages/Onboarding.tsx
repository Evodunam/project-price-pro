import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ColorPicker } from "@/components/ui/color-picker";

type OnboardingStep = 0 | 1 | 2;

const OnboardingSteps = {
  BUSINESS_INFO: 0,
  BRANDING: 1,
  SETTINGS: 2,
} as const;

const CONSTRUCTION_INDUSTRIES = [
  "General Contractor",
  "Residential Construction",
  "Commercial Construction",
  "Remodeling",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Landscaping",
  "Interior Design",
  "Painting",
  "Flooring",
  "Masonry",
  "Carpentry",
] as const;

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingSteps.BUSINESS_INFO);
  const [loading, setLoading] = useState(false);
  const [activeColorType, setActiveColorType] = useState<'primary' | 'secondary'>('primary');
  const [formData, setFormData] = useState({
    businessName: "",
    fullName: "",
    industry: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    licenseNumber: "",
    primaryColor: "#007AFF",
    secondaryColor: "#F5F5F7",
    minimumProjectCost: "1000",
    markupPercentage: "20",
    taxRate: "8.5",
  });

  const [touched, setTouched] = useState({
    businessName: false,
    fullName: false,
    industry: false,
    contactEmail: false,
    contactPhone: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, industry: value }));
    setTouched((prev) => ({ ...prev, industry: true }));
  };

  const isRequiredFieldEmpty = (fieldName: string) => {
    return touched[fieldName as keyof typeof touched] && !formData[fieldName as keyof typeof formData];
  };

  const isBusinessInfoValid = () => {
    const requiredFields = ['businessName', 'fullName', 'industry', 'contactEmail', 'contactPhone'];
    return requiredFields.every(field => formData[field as keyof typeof formData]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "No authenticated user found. Please log in again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data: existingContractor, error: fetchError } = await supabase
        .from("contractors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let contractorId: string;

      if (existingContractor) {
        const { error: updateError } = await supabase
          .from("contractors")
          .update({
            business_name: formData.businessName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            business_address: formData.address,
            license_number: formData.licenseNumber,
            branding_colors: {
              primary: formData.primaryColor,
              secondary: formData.secondaryColor,
            },
          })
          .eq("id", existingContractor.id);

        if (updateError) throw updateError;
        contractorId = existingContractor.id;
      } else {
        const { data: newContractor, error: insertError } = await supabase
          .from("contractors")
          .insert({
            id: user.id,
            user_id: user.id,
            business_name: formData.businessName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            business_address: formData.address,
            license_number: formData.licenseNumber,
            branding_colors: {
              primary: formData.primaryColor,
              secondary: formData.secondaryColor,
            },
          })
          .select()
          .single();

        if (insertError) throw insertError;
        contractorId = newContractor.id;
      }

      const { error: settingsError } = await supabase
        .from("contractor_settings")
        .upsert({
          id: contractorId,
          minimum_project_cost: parseFloat(formData.minimumProjectCost),
          markup_percentage: parseFloat(formData.markupPercentage),
          tax_rate: parseFloat(formData.taxRate),
          branding_colors: {
            primary: formData.primaryColor,
            secondary: formData.secondaryColor,
          },
        });

      if (settingsError) throw settingsError;

      toast({
        title: "Success!",
        description: "Your business information has been saved successfully.",
      });
      
      if (currentStep === OnboardingSteps.SETTINGS) {
        navigate("/dashboard");
      } else {
        setCurrentStep((prev) => (prev + 1) as OnboardingStep);
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while saving your information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateGlobalColors = (primaryColor: string, secondaryColor: string) => {
    const root = document.documentElement;
    
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-foreground', '#FFFFFF');
    
    const primaryHex = primaryColor.replace('#', '');
    const r = parseInt(primaryHex.slice(0, 2), 16);
    const g = parseInt(primaryHex.slice(2, 4), 16);
    const b = parseInt(primaryHex.slice(4, 6), 16);
    
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;
    
    let h, s;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r / 255:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g / 255:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    
    root.style.setProperty('--primary-100', `hsl(${h}, ${s * 100}%, 95%)`);
    root.style.setProperty('--primary-200', `hsl(${h}, ${s * 100}%, 90%)`);
    root.style.setProperty('--primary-300', `hsl(${h}, ${s * 100}%, 85%)`);
    root.style.setProperty('--primary-400', `hsl(${h}, ${s * 100}%, 80%)`);
    root.style.setProperty('--primary-500', primaryColor);
    root.style.setProperty('--primary-600', `hsl(${h}, ${s * 100}%, 45%)`);
    root.style.setProperty('--primary-700', `hsl(${h}, ${s * 100}%, 40%)`);
    
    root.style.setProperty('--secondary', secondaryColor);
    root.style.setProperty('--secondary-foreground', '#1d1d1f');
    
    root.style.setProperty('--accent', primaryColor);
    root.style.setProperty('--accent-foreground', '#FFFFFF');
    
    root.style.setProperty('--ring', primaryColor);
  };

  const handlePrimaryColorChange = (newColor: string) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: newColor
    }));
    updateGlobalColors(newColor, formData.secondaryColor);
  };

  const handleSecondaryColorChange = (newColor: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryColor: newColor
    }));
    updateGlobalColors(formData.primaryColor, newColor);
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingSteps.BUSINESS_INFO:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">
                Business Information
              </h1>
              <p className="text-[15px] text-[#86868b]">
                This information will be visible to customers when they show interest in your services.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-8 space-y-4">
              <div className="space-y-4">
                <Input
                  id="businessName"
                  name="businessName"
                  label="Business Name"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className={isRequiredFieldEmpty('businessName') ? 'border-red-500' : ''}
                />
                {isRequiredFieldEmpty('businessName') && (
                  <span className="text-red-500 text-xs mt-1">Business name is required</span>
                )}

                <Input
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className={isRequiredFieldEmpty('fullName') ? 'border-red-500' : ''}
                />
                {isRequiredFieldEmpty('fullName') && (
                  <span className="text-red-500 text-xs mt-1">Full name is required</span>
                )}

                <div className="relative">
                  <CustomSelect
                    label="Industry"
                    value={formData.industry}
                    onValueChange={handleSelectChange}
                    options={CONSTRUCTION_INDUSTRIES.map(industry => ({
                      value: industry,
                      label: industry
                    }))}
                    className={isRequiredFieldEmpty('industry') ? 'border-red-500' : ''}
                  />
                  {isRequiredFieldEmpty('industry') && (
                    <span className="text-red-500 text-xs mt-1">Industry is required</span>
                  )}
                </div>

                <Input
                  id="contactPhone"
                  name="contactPhone"
                  label="Contact Phone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  required
                  className={isRequiredFieldEmpty('contactPhone') ? 'border-red-500' : ''}
                />
                {isRequiredFieldEmpty('contactPhone') && (
                  <span className="text-red-500 text-xs mt-1">Contact phone is required</span>
                )}

                <Input
                  id="contactEmail"
                  name="contactEmail"
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  required
                  className={isRequiredFieldEmpty('contactEmail') ? 'border-red-500' : ''}
                />
                {isRequiredFieldEmpty('contactEmail') && (
                  <span className="text-red-500 text-xs mt-1">Contact email is required</span>
                )}

                <Input
                  id="address"
                  name="address"
                  label="Business Address (Optional)"
                  value={formData.address}
                  onChange={handleInputChange}
                />

                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  label="License Number (Optional)"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                />

                <div className="flex justify-between pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as OnboardingStep)}
                    disabled={currentStep === OnboardingSteps.BUSINESS_INFO || loading}
                    className="text-[17px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isBusinessInfoValid() || loading}
                    className="h-[44px] px-6 text-[17px] font-medium text-white hover:bg-primary-600 rounded-full"
                  >
                    {loading ? "Saving..." : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case OnboardingSteps.BRANDING:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">
                Branding
              </h1>
              <p className="text-[15px] text-[#86868b]">
                Customize your brand colors to match your business identity.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-8 space-y-6">
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Primary Color
                  </label>
                  <div className="flex items-center w-full">
                    <ColorPicker
                      color={formData.primaryColor}
                      onChange={handlePrimaryColorChange}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Secondary Color
                  </label>
                  <div className="flex items-center w-full">
                    <ColorPicker
                      color={formData.secondaryColor}
                      onChange={handleSecondaryColorChange}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as OnboardingStep)}
                    disabled={loading}
                    className="text-[17px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="h-[44px] px-6 text-[17px] font-medium text-white hover:bg-primary-600 rounded-full"
                  >
                    {loading ? "Saving..." : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case OnboardingSteps.SETTINGS:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">
                Business Settings
              </h1>
              <p className="text-[15px] text-[#86868b]">
                Configure your business settings for estimates and invoices.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm p-8 space-y-4">
              <div className="space-y-4">
                <Input
                  id="minimumProjectCost"
                  name="minimumProjectCost"
                  type="number"
                  label="Minimum Project Cost ($)"
                  value={formData.minimumProjectCost}
                  onChange={handleInputChange}
                />

                <Input
                  id="markupPercentage"
                  name="markupPercentage"
                  type="number"
                  label="Markup Percentage (%)"
                  value={formData.markupPercentage}
                  onChange={handleInputChange}
                />

                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  label="Tax Rate (%)"
                  value={formData.taxRate}
                  onChange={handleInputChange}
                />

                <div className="flex justify-between pt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep((prev) => (prev - 1) as OnboardingStep)}
                    disabled={loading}
                    className="text-[17px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="h-[44px] px-6 text-[17px] font-medium text-white hover:bg-primary-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Complete"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="container max-w-2xl mx-auto">
        <ProgressSteps
          currentStep={currentStep}
          steps={[
            { label: "Business Info", value: OnboardingSteps.BUSINESS_INFO },
            { label: "Branding", value: OnboardingSteps.BRANDING },
            { label: "Settings", value: OnboardingSteps.SETTINGS },
          ]}
        />
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;
