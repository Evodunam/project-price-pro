
import { Button } from "@/components/ui/3d-button";

interface ContactFormButtonsProps {
  isSubmitting: boolean;
  buttonStyle?: React.CSSProperties;
  isCurrentUserContractor?: boolean;
  onSkip?: () => Promise<void>;
}

export const ContactFormButtons = ({ 
  isSubmitting, 
  buttonStyle, 
  isCurrentUserContractor,
  onSkip 
}: ContactFormButtonsProps) => {
  return (
    <>
      <Button 
        type="submit" 
        className="w-full mt-6" 
        disabled={isSubmitting}
        style={buttonStyle}
      >
        {isSubmitting ? "Processing..." : "View Your Custom Estimate"}
      </Button>

      {isCurrentUserContractor && onSkip && (
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={onSkip}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Skip Form (Test Estimate)"}
        </Button>
      )}
    </>
  );
};
