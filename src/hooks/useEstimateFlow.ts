
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Category, CategoryQuestions, AnswersState, EstimateConfig } from "@/types/estimate";
import { findMatchingQuestionSets, consolidateQuestionSets } from "@/utils/questionSetMatcher";
import { Database, Json } from "@/integrations/supabase/types";

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export type EstimateStage = 'photo' | 'description' | 'questions' | 'contact' | 'estimate' | 'category';

export const useEstimateFlow = (config: EstimateConfig) => {
  const [stage, setStage] = useState<EstimateStage>('photo');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [projectDescription, setProjectDescription] = useState("");
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);
  const [matchedQuestionSets, setMatchedQuestionSets] = useState<CategoryQuestions[]>([]);
  const [progress, setProgress] = useState(0);
  const [estimate, setEstimate] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);
  const [answers, setAnswers] = useState<AnswersState>({});
  const { toast } = useToast();

  const handlePhotoUpload = (urls: string[]) => {
    setUploadedPhotos(urls);
    if (urls.length > 0) {
      setUploadedImageUrl(urls[0]);
    }
    setStage('description');
  };

  const handleDescriptionSubmit = async (description: string) => {
    setProjectDescription(description);
    const categoriesForMatching = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      keywords: category.keywords || [],
      questions: category.questions || []
    }));

    const matches = await findMatchingQuestionSets(description, categoriesForMatching);
    const consolidatedSets = consolidateQuestionSets(matches, description);

    if (consolidatedSets.length === 0) {
      setStage('category');
      return;
    }

    if (consolidatedSets[0]?.category) {
      setSelectedCategory(consolidatedSets[0].category);
    }

    setMatchedQuestionSets(consolidatedSets);
    setStage('questions');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStage('questions');
  };

  const checkEstimateStatus = async (leadId: string) => {
    const { data: lead } = await supabase
      .from('leads')
      .select('estimate_data, status, error_message')
      .eq('id', leadId)
      .maybeSingle();

    if (!lead) return false;

    if (lead.status === 'error') {
      throw new Error(lead.error_message || 'Failed to generate estimate');
    }

    if (lead.status === 'complete' && lead.estimate_data) {
      setEstimate(lead.estimate_data);
      setIsGeneratingEstimate(false);
      setStage('estimate');
      return true;
    }

    return false;
  };

  const startEstimateGeneration = async (leadId: string) => {
    try {
      console.log('Starting background estimate generation for lead:', leadId);
      
      const { error } = await supabase.functions.invoke('generate-estimate', {
        body: { 
          leadId,
          contractorId: config.contractorId,
          projectDescription,
          category: selectedCategory,
          imageUrl: uploadedImageUrl,
          projectImages: uploadedPhotos
        }
      });

      if (error) throw error;

      // Start polling for estimate completion
      const pollInterval = setInterval(async () => {
        try {
          const isComplete = await checkEstimateStatus(leadId);
          if (isComplete) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsGeneratingEstimate(false);
          console.error('Error polling estimate:', error);
          toast({
            title: "Error",
            description: "Failed to generate estimate. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000);

      // Set a timeout to stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGeneratingEstimate) {
          setIsGeneratingEstimate(false);
          toast({
            title: "Error",
            description: "Estimate generation timed out. Please try again.",
            variant: "destructive",
          });
        }
      }, 120000);

    } catch (error) {
      console.error('Error initiating estimate generation:', error);
      setIsGeneratingEstimate(false);
      toast({
        title: "Error",
        description: "Failed to start estimate generation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuestionComplete = async (answers: AnswersState) => {
    if (!config.contractorId) {
      console.error('Missing contractor ID in config:', config);
      toast({
        title: "Error",
        description: "Contractor ID is required",
        variant: "destructive",
      });
      return;
    }

    const currentCategory = matchedQuestionSets[0]?.category;
    const firstAnswer = answers[currentCategory]?.Q1?.answers[0];
    
    setAnswers(answers);

    try {
      // Create the lead first
      const leadData: LeadInsert = {
        project_description: firstAnswer || projectDescription || 'New project',
        project_title: `${currentCategory || 'New'} Project`,
        answers: formatAnswersForJson(answers),
        category: currentCategory,
        status: 'pending',
        contractor_id: config.contractorId,
        project_images: uploadedPhotos
      };

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) throw leadError;
      
      if (!lead?.id) {
        throw new Error('Failed to create lead - no ID returned');
      }

      setCurrentLeadId(lead.id);
      setIsGeneratingEstimate(true);

      // Start estimate generation in the background
      startEstimateGeneration(lead.id);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "Failed to start estimate generation. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Move to contact form while estimate generates in background
    setStage('contact');
  };

  const formatAnswersForJson = (answers: AnswersState): Json => {
    const formattedAnswers = Object.entries(answers).reduce((acc, [category, categoryAnswers]) => {
      acc[category] = Object.entries(categoryAnswers || {}).reduce((catAcc, [questionId, answer]) => {
        catAcc[questionId] = {
          question: answer.question,
          type: answer.type,
          answers: answer.answers,
          options: answer.options
        };
        return catAcc;
      }, {} as Record<string, any>);
      return acc;
    }, {} as Record<string, any>);

    return formattedAnswers as Json;
  };

  const handleContactSubmit = async (contactData: any) => {
    try {
      if (!config.contractorId) {
        console.error('Missing contractor ID:', config);
        throw new Error('Contractor ID is required');
      }

      const currentCategory = matchedQuestionSets[0]?.category;
      const firstAnswer = answers[currentCategory]?.Q1?.answers[0];

      // Convert answers to Json type
      const formattedAnswers = formatAnswersForJson(answers);

      const leadData: LeadInsert = {
        project_description: firstAnswer || projectDescription || 'New project',
        project_title: `${currentCategory || 'New'} Project`,
        answers: formattedAnswers,
        category: currentCategory,
        status: 'pending',
        contractor_id: config.contractorId,
        project_images: uploadedPhotos,
        user_name: contactData.fullName,
        user_email: contactData.email,
        user_phone: contactData.phone,
        project_address: contactData.address
      };

      console.log('Creating lead with data:', leadData);

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) throw leadError;
      
      if (!lead?.id) {
        throw new Error('Failed to create lead - no ID returned');
      }

      console.log('Lead created successfully:', lead.id);
      setCurrentLeadId(lead.id);
      setIsGeneratingEstimate(true);

      startEstimateGeneration(lead.id);

    } catch (error) {
      console.error('Error processing contact form:', error);
      toast({
        title: "Error",
        description: "Failed to process your information. Please try again.",
        variant: "destructive",
      });
      setIsGeneratingEstimate(false);
    }
  };

  const handleSkip = async () => {
    if (!config.contractorId) {
      console.error('Missing contractor ID:', config);
      return;
    }

    try {
      setIsGeneratingEstimate(true);

      // Convert answers to Json type
      const formattedAnswers = formatAnswersForJson(answers);

      const leadData: LeadInsert = {
        project_description: projectDescription || 'Test project',
        project_title: `Test Project`,
        answers: formattedAnswers,
        category: selectedCategory,
        status: 'pending',
        contractor_id: config.contractorId,
        project_images: uploadedPhotos,
        is_test_estimate: true
      };

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError) throw leadError;
      
      if (!lead?.id) {
        throw new Error('Failed to create lead - no ID returned');
      }

      setCurrentLeadId(lead.id);
      
      // Start estimate generation just like in contact form submission
      startEstimateGeneration(lead.id);

    } catch (error) {
      console.error('Error skipping contact form:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      setIsGeneratingEstimate(false);
    }
  };

  return {
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
    handleContactSubmit,
    handleSkip
  };
};
