/**
 * Custom hook for managing election freeze state and permissions
 */

import { useMemo } from 'react';
import { Election } from '@/types/election';
import { 
  isElectionFrozen, 
  isOperationAllowed, 
  getFreezeStatusMessage,
  FreezeRestrictedOperation 
} from '@/utils/electionFreezeUtils';

interface UseElectionFreezeOptions {
  election: Election | null | undefined;
}

interface UseElectionFreezeReturn {
  isFrozen: boolean;
  canModify: boolean;
  freezeMessage: string;
  canPerformOperation: (operation: string) => boolean;
  getDisabledProps: (operation?: FreezeRestrictedOperation) => {
    disabled: boolean;
    title?: string;
  };
}

/**
 * Hook to manage election freeze state and check permissions
 * 
 * @example
 * const { isFrozen, canModify, getDisabledProps } = useElectionFreeze({ election });
 * 
 * <button {...getDisabledProps('update')}>Update Voter</button>
 */
export const useElectionFreeze = ({ 
  election 
}: UseElectionFreezeOptions): UseElectionFreezeReturn => {
  
  const isFrozen = useMemo(() => 
    isElectionFrozen(election), 
    [election]
  );

  const canModify = useMemo(() => 
    !isFrozen, 
    [isFrozen]
  );

  const freezeMessage = useMemo(() => 
    getFreezeStatusMessage(isFrozen), 
    [isFrozen]
  );

  const canPerformOperation = (operation: string): boolean => {
    return isOperationAllowed(operation, isFrozen);
  };

  const getDisabledProps = (operation?: FreezeRestrictedOperation) => {
    const shouldDisable = operation ? !canPerformOperation(operation) : !canModify;
    
    return {
      disabled: shouldDisable,
      ...(shouldDisable && {
        title: 'Election is frozen. No modifications allowed.',
      }),
    };
  };

  return {
    isFrozen,
    canModify,
    freezeMessage,
    canPerformOperation,
    getDisabledProps,
  };
};
