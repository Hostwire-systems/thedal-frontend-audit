import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
} from "react";

interface LoadingContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
  }

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Provider component
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
  
    const setLoading = (loading: boolean) => {
      setIsLoading(loading);
    };

    return (
        <LoadingContext.Provider value={{ isLoading, setLoading }}>
          {children}
        </LoadingContext.Provider>
      );
    };

// Hook
export const useLoading = (): LoadingContextType => {
    const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("ERROR: context not available!");
  }
  return context;
};

