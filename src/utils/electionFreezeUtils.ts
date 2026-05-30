/**
 * Election Freeze Utilities
 * Helper functions and hooks for handling frozen election state
 */

import { Election } from '@/types/election';

/**
 * Check if an election is frozen
 */
export const isElectionFrozen = (election: Election | null | undefined): boolean => {
  return election?.isFrozen === true;
};

/**
 * Get freeze status message
 */
export const getFreezeStatusMessage = (isFrozen: boolean): string => {
  return isFrozen 
    ? 'This election is frozen and in read-only mode. No modifications are allowed.'
    : 'This election is active and can be modified.';
};

/**
 * Get freeze action label
 */
export const getFreezeActionLabel = (isFrozen: boolean): string => {
  return isFrozen ? 'Unfreeze Election' : 'Freeze Election';
};

/**
 * Error codes related to election freeze
 */
export const FREEZE_ERROR_CODES = {
  ELECTION_ALREADY_FROZEN: 70245,
  ELECTION_NOT_FROZEN: 70246,
  ELECTION_FROZEN: 70247,
} as const;

/**
 * Check if error is freeze-related
 */
export const isFreezeError = (errorCode?: number): boolean => {
  return errorCode ? Object.values(FREEZE_ERROR_CODES).includes(errorCode) : false;
};

/**
 * Get user-friendly error message for freeze errors
 */
export const getFreezeErrorMessage = (errorCode: number): string => {
  switch (errorCode) {
    case FREEZE_ERROR_CODES.ELECTION_ALREADY_FROZEN:
      return 'This election is already frozen.';
    case FREEZE_ERROR_CODES.ELECTION_NOT_FROZEN:
      return 'This election is not currently frozen.';
    case FREEZE_ERROR_CODES.ELECTION_FROZEN:
      return 'Cannot perform this action. Election is frozen and in read-only mode.';
    default:
      return 'An error occurred with the freeze operation.';
  }
};

/**
 * Operations that should be disabled when election is frozen
 */
export const FREEZE_RESTRICTED_OPERATIONS = [
  'create',
  'update',
  'delete',
  'import',
  'export-with-modifications',
  'assign',
  'upload',
  'bulk-update',
] as const;

export type FreezeRestrictedOperation = typeof FREEZE_RESTRICTED_OPERATIONS[number];

/**
 * Check if an operation is allowed when election is frozen
 */
export const isOperationAllowed = (
  operation: string,
  isFrozen: boolean
): boolean => {
  if (!isFrozen) return true;
  return !FREEZE_RESTRICTED_OPERATIONS.includes(operation as FreezeRestrictedOperation);
};

/**
 * Read-only operations that are always allowed
 */
export const READONLY_OPERATIONS = [
  'view',
  'read',
  'list',
  'search',
  'filter',
  'export',
  'download',
  'print',
] as const;
