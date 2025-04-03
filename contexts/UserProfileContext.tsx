import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { UserProfile, HealthGoal, DietaryRestriction } from '../types';

// Generate a random ID for a new user
const generateUserId = () => `user-${Math.random().toString(36).substring(2, 9)}`;

// Default profile settings
const defaultProfile: UserProfile = {
  id: generateUserId(),
  name: 'Guest User',
  healthGoals: [HealthGoal.GeneralHealth],
  dietaryRestrictions: [DietaryRestriction.None],
  saveHistory: true
};

// Context type definition
interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// Create context with default values
export const UserProfileContext = createContext<UserProfileContextType>({
  profile: null,
  isLoading: true,
  error: null,
  updateProfile: () => {},
});

// Provider component
interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user profile
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        setIsLoading(true);
        
        // Check if profile exists in localStorage
        const storedProfile = localStorage.getItem('userProfile');
        
        if (storedProfile) {
          // If exists, parse and use it
          const parsedProfile = JSON.parse(storedProfile) as UserProfile;
          setProfile(parsedProfile);
        } else {
          // If not, create a new profile
          const newProfile = { ...defaultProfile, id: generateUserId() };
          
          // Save to localStorage
          localStorage.setItem('userProfile', JSON.stringify(newProfile));
          setProfile(newProfile);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
        
        // Fallback to default profile
        setProfile(defaultProfile);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Update user profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    try {
      if (!profile) return;
      
      const updatedProfile = { ...profile, ...updates };
      
      // Update localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      // Update state
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update user profile');
    }
  };

  return (
    <UserProfileContext.Provider 
      value={{ 
        profile, 
        isLoading, 
        error, 
        updateProfile 
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};