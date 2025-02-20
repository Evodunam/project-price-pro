
import { useEffect, useRef } from "react";
import { EstimateAnimation } from "./EstimateAnimation";

interface LoadingScreenProps {
  message: string;
  isEstimate?: boolean;
  isBackdrop?: boolean;
}

export const LoadingScreen = ({ message, isEstimate = false, isBackdrop = false }: LoadingScreenProps) => {
  return (
    <div className={`fixed inset-0 ${isBackdrop ? 'bg-transparent' : 'bg-background/80'} backdrop-blur-sm ${isBackdrop ? 'z-10' : 'z-50'} flex items-center justify-center animate-in fade-in-0`}>
      <div className={`text-center space-y-4 p-6 ${!isBackdrop && 'rounded-lg bg-white shadow-lg'}`}>
        {isEstimate ? (
          <div className="w-screen h-screen flex flex-col items-center justify-center">
            <div className="w-[300px] h-[300px] mx-auto">
              <EstimateAnimation />
            </div>
            <p className="text-xl font-medium text-foreground mt-8">{message}</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center space-x-2 mb-4">
              <div className="animate-pulse h-8 w-8 rounded-full bg-primary/20" />
            </div>
            <p className="text-lg font-medium text-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};
