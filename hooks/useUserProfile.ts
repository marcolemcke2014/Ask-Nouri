import { useContext } from 'react';
import { UserProfileContext } from '../contexts/UserProfileContext';

/**
 * Hook to access the UserProfileContext
 * 
 * @deprecated Use useContext(UserProfileContext) directly instead
 */
export function useUserProfile() {
  return useContext(UserProfileContext);
}