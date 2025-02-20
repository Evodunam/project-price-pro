
import { useEffect } from "react";
import { QuestionCard } from "./QuestionCard";
import { LoadingScreen } from "./LoadingScreen";
import { CategoryQuestions, AnswersState } from "@/types/estimate";
import { useQuestionManager } from "@/hooks/useQuestionManager";

interface QuestionManagerProps {
  questionSets: CategoryQuestions[];
  onComplete: (answers: AnswersState) => void;
  onProgressChange: (progress: number) => void;
}

export const QuestionManager = ({
  questionSets,
  onComplete,
  onProgressChange,
}: QuestionManagerProps) => {
  const {
    currentQuestion,
    currentSet,
    currentSetAnswers,
    isLoadingQuestions,
    hasFollowUpQuestion,
    currentStage,
    totalStages,
    handleAnswer,
    handleMultipleChoiceNext,
    calculateProgress
  } = useQuestionManager(questionSets, onComplete, onProgressChange);

  // Log the current state for debugging
  console.log('QuestionManager state:', {
    currentQuestion,
    currentSet,
    isLoadingQuestions,
    hasFollowUpQuestion,
    currentStage,
    totalStages,
    currentSetAnswers,
    progress: calculateProgress()
  });

  // Update progress whenever current question changes
  useEffect(() => {
    if (currentQuestion) {
      const progress = calculateProgress();
      onProgressChange(progress);
    }
  }, [currentQuestion, calculateProgress, onProgressChange]);

  if (isLoadingQuestions) {
    return <LoadingScreen message="Loading questions..." />;
  }

  if (!currentQuestion) {
    return null;
  }

  const isLastQuestion = currentStage === totalStages && !hasFollowUpQuestion;

  return (
    <QuestionCard
      question={currentQuestion}
      selectedAnswers={currentSetAnswers[currentQuestion.id]?.answers || []}
      onSelect={handleAnswer}
      onNext={currentQuestion.type === 'multiple_choice' ? handleMultipleChoiceNext : undefined}
      isLastQuestion={isLastQuestion}
      currentStage={currentStage}
      totalStages={totalStages}
      hasFollowUpQuestion={hasFollowUpQuestion}
    />
  );
};

export default QuestionManager;
