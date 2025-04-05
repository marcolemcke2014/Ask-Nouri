import React from 'react';
import AppShell from '@/components/layout/AppShell';

export default function ProfilePage() {
  return (
    <AppShell title="Profile">
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">
              M
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold">Marco Lemcke</h2>
              <p className="text-gray-600">NutriFlow Member</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg mb-3">Dietary Preferences</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-lg p-3">
                <span className="font-medium">Weight Goal</span>
                <p className="text-gray-700">Weight Loss</p>
              </div>
              <div className="border rounded-lg p-3">
                <span className="font-medium">Diet Type</span>
                <p className="text-gray-700">Balanced</p>
              </div>
              <div className="border rounded-lg p-3">
                <span className="font-medium">Allergies</span>
                <p className="text-gray-700">None</p>
              </div>
              <div className="border rounded-lg p-3">
                <span className="font-medium">Restrictions</span>
                <p className="text-gray-700">Low Sodium</p>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-6 pt-4">
            <button className="w-full py-3 bg-green-50 text-green-700 rounded-lg font-medium">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
} 