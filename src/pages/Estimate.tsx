
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEstimateFlow } from "@/hooks/useEstimateFlow";
import { EstimateProgress } from "@/components/EstimateForm/EstimateProgress";
import { ContactForm } from "@/components/EstimateForm/ContactForm";
import { EstimateDisplay } from "@/components/EstimateForm/EstimateDisplay";
import { LoadingScreen } from "@/components/EstimateForm/LoadingScreen";
import { QuestionManager } from "@/components/EstimateForm/QuestionManager";
import { PhotoUploadStep } from "@/components/EstimateForm/PhotoUploadStep";
import { ProjectDescriptionStep } from "@/components/EstimateForm/ProjectDescriptionStep";
import { CategorySelectionStep } from "@/components/EstimateForm/CategorySelectionStep";
import { EstimateAnimation } from "@/components/EstimateForm/EstimateAnimation";
import { Category, EstimateConfig } from "@/types/estimate";
import { EstimateSkeleton } from "@/components/EstimateForm/EstimateSkeleton";
import { MultiStepSkeleton } from "@/components/EstimateForm/MultiStepSkeleton";

const DEFAULT_CONTRACTOR_ID = "098bcb69-99c6-445b-bf02-94dc7ef8c938";

// Validate UUID format
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const EstimatePage = () => {
  const navigate = useNavigate();
  const { contractorId } = useParams();
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Get the contractor ID from the URL first
  const urlContractorId = (() => {
    try {
      if (!contractorId || contractorId === ":contractorId?" || contractorId === "undefined") {
        return DEFAULT_CONTRACTOR_ID;
      }
      
      // Clean the ID without decoding/encoding
      return isValidUUID(contractorId) ? contractorId : DEFAULT_CONTRACTOR_ID;
      
    } catch (error) {
      console.error('Error processing URL contractor ID:', error);
      return DEFAULT_CONTRACTOR_ID;
    }
  })();

  console.log('Using contractor ID:', urlContractorId);

  // Get the authenticated user's contractor ID for comparison only
  const { data: authenticatedContractor } = useQuery({
    queryKey: ['authenticated-contractor'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      setAuthUserId(user.id);
      setIsAuthenticated(true);

      const { data: contractor } = await supabase
        .from('contractors')
        .select('id')
        .eq('id', user.id)
        .single();

      console.log('Authenticated contractor:', contractor);
      return contractor;
    },
  });

  // Always use the URL contractor ID for the estimate config
  const estimateConfig: EstimateConfig = {
    contractorId: urlContractorId,
    isPreview: false,
    allowSignature: true,
    showSubtotals: true
  };

  const { data: contractor, isLoading: isContractorLoading } = useQuery({
    queryKey: ["contractor", urlContractorId],
    queryFn: async () => {
      console.log('Fetching contractor settings for ID:', urlContractorId);
      const { data, error } = await supabase
        .from("contractors")
        .select(`
          *,
          contractor_settings!contractor_settings_id_fkey (*)
        `)
        .eq("id", urlContractorId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching contractor:', error);
        throw error;
      }
      if (!data) {
        console.error('No contractor found with ID:', urlContractorId);
        throw new Error("Contractor not found");
      }

      // Transform the data to ensure contractor_settings is a single object
      return {
        ...data,
        contractor_settings: data.contractor_settings ? data.contractor_settings[0] : null
      };
    },
    enabled: isValidUUID(urlContractorId),
    retry: false
  });

  const {
    stage,
    setStage,
    uploadedImageUrl,
    uploadedPhotos,
    projectDescription,
    currentLeadId,
    selectedCategory,
    completedCategories,
    matchedQuestionSets,
    progress,
    estimate,
    categories,
    setCategories,
    isLoading,
    setIsLoading,
    isGeneratingEstimate,
    handlePhotoUpload,
    handleDescriptionSubmit,
    handleCategorySelect,
    handleQuestionComplete,
    handleContactSubmit
  } = useEstimateFlow(estimateConfig);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: optionsData, error: optionsError } = await supabase
          .from('Options')
          .select('*')
          .eq('Key Options', '42e64c9c-53b2-49bd-ad77-995ecb3106c6')
          .single();

        if (optionsError) throw optionsError;

        const transformedCategories: Category[] = Object.keys(optionsData)
          .filter(key => key !== 'Key Options')
          .map(key => {
            const catData = optionsData[key] as Record<string, any>;
            return {
              id: key,
              name: catData.name || key.replace(/_/g, ' '),
              description: catData.description || `Get an estimate for your ${key.toLowerCase()} project`,
              icon: catData.icon,
              keywords: Array.isArray(catData.keywords) ? catData.keywords : [],
              questions: Array.isArray(catData.questions) ? catData.questions : []
            };
          });

        setCategories(transformedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSpeechSupported(isSupported);
  }, []);

  // Show loading state if contractor data is loading
  if (isContractorLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="w-full h-8 bg-gray-200 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          {stage === 'estimate' ? <EstimateSkeleton /> : <MultiStepSkeleton />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <EstimateProgress stage={stage} progress={progress} />
      
      {isAuthenticated && authenticatedContractor?.id === urlContractorId && (
        <div className="w-full border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 p-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {stage === 'photo' && (
          <PhotoUploadStep
            onPhotoUploaded={handlePhotoUpload}
            onSkip={() => setStage('description')}
            contractor={contractor}
          />
        )}

        {stage === 'description' && (
          <ProjectDescriptionStep
            onSubmit={handleDescriptionSubmit}
            isSpeechSupported={isSpeechSupported}
          />
        )}

        {stage === 'category' && (
          <CategorySelectionStep
            categories={categories}
            selectedCategory={selectedCategory || undefined}
            completedCategories={completedCategories}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {stage === 'questions' && matchedQuestionSets.length > 0 && (
          <QuestionManager
            questionSets={matchedQuestionSets}
            onComplete={handleQuestionComplete}
            onProgressChange={progress => setStage('questions')}
          />
        )}

        <div className="relative">
          {(stage === 'contact' || stage === 'estimate') && (
            <div className={cn(
              "transition-all duration-300",
              stage === 'contact' ? "blur-sm" : ""
            )}>
              <EstimateDisplay 
                groups={estimate?.groups || []} 
                totalCost={estimate?.totalCost || 0}
                contractor={contractor || undefined}
                projectSummary={projectDescription}
                estimate={estimate}
                isLoading={isGeneratingEstimate}
                projectImages={uploadedPhotos}
              />
            </div>
          )}

          {stage === 'contact' && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="animate-fadeIn relative z-30 w-full max-w-lg">
                <ContactForm 
                  onSubmit={handleContactSubmit} 
                  leadId={currentLeadId || undefined}
                  estimate={estimate}
                  contractor={contractor}
                  contractorId={urlContractorId}
                  onSkip={async () => {
                    if (currentLeadId) {
                      await handleContactSubmit({});
                    }
                  }}
                />
              </div>
            </div>
          )}

          {isGeneratingEstimate && (
            <div className="fixed inset-0 bg-background/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="text-center">
                <EstimateAnimation className="w-24 h-24 mx-auto mb-4" />
                <p className="text-lg font-medium text-primary">
                  Generating your estimate...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimatePage;
