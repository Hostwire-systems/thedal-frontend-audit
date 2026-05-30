// src/utlis/subscriptionUtils.ts

import { getMyModuleAccess, getUserModuleAccess } from '../api/subscriptionApi';
import { setModuleAccess, setError, setLoading } from '../redux/slices/subscriptionSlice';
import { AppDispatch } from '../redux/store';

const DEFAULT_SUBSCRIPTION_MIN_INTERVAL_MS = 30000;

let subscriptionsRequestPromise: Promise<void> | null = null;
let lastSuccessfulSubscriptionFetchAt = 0;

interface LoadUserSubscriptionsOptions {
  minIntervalMs?: number;
}

/**
 * Load user's module access from the backend and store in Redux
 */
export const loadUserSubscriptions = async (
  dispatch: AppDispatch,
  userId?: number,
  options: LoadUserSubscriptionsOptions = {}
) => {
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_SUBSCRIPTION_MIN_INTERVAL_MS;
  const now = Date.now();

  if (subscriptionsRequestPromise) {
    return subscriptionsRequestPromise;
  }

  if (lastSuccessfulSubscriptionFetchAt > 0 && now - lastSuccessfulSubscriptionFetchAt < minIntervalMs) {
    return;
  }

  subscriptionsRequestPromise = (async () => {
  try {
    dispatch(setLoading(true));
    console.log('Fetching user subscriptions from API...');
    
    const response = userId 
      ? await getUserModuleAccess(userId)
      : await getMyModuleAccess();
    
    console.log('Subscription API response:', response);
    
    if (response.status === 'success') {
      console.log('Successfully loaded subscriptions:', {
        moduleCount: response.data.accessibleModuleKeys?.length || 0,
        modules: response.data.accessibleModuleKeys
      });
      lastSuccessfulSubscriptionFetchAt = Date.now();
      dispatch(setModuleAccess({
        accessibleModuleKeys: response.data.accessibleModuleKeys || [],
        accessibleModules: response.data.accessibleModules || [],
      }));
    } else {
      console.error('Failed to load module access - invalid status:', response);
      dispatch(setError('Failed to load module access'));
    }
  } catch (error: any) {
    console.error('Error loading subscriptions:', error);
    dispatch(setError(error.message || 'Failed to load subscriptions'));
  } finally {
    dispatch(setLoading(false));
    subscriptionsRequestPromise = null;
  }
  })();

  return subscriptionsRequestPromise;
};

/**
 * Check if user has access to a specific module
 */
export const hasModuleAccess = (accessibleModuleKeys: string[], moduleKey: string): boolean => {
  return accessibleModuleKeys.includes(moduleKey);
};

/**
 * Check if user has access to any of the provided module keys
 */
export const hasAnyModuleAccess = (accessibleModuleKeys: string[], moduleKeys: string[]): boolean => {
  return moduleKeys.some(key => accessibleModuleKeys.includes(key));
};

/**
 * Check if user has access to all provided module keys
 */
export const hasAllModuleAccess = (accessibleModuleKeys: string[], moduleKeys: string[]): boolean => {
  return moduleKeys.every(key => accessibleModuleKeys.includes(key));
};

/**
 * Check if user has access to parent module or any of its children
 */
export const hasParentOrChildAccess = (
  accessibleModuleKeys: string[], 
  parentKey: string, 
  childKeys: string[]
): boolean => {
  return hasModuleAccess(accessibleModuleKeys, parentKey) || 
         hasAnyModuleAccess(accessibleModuleKeys, childKeys);
};
