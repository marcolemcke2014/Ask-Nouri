import React from 'react';
import AppShell from '@/components/layout/AppShell';

export default function SettingsPage() {
  const settingsGroups = [
    {
      title: 'Preferences',
      settings: [
        { name: 'Dark Mode', type: 'toggle', value: false },
        { name: 'Enable Notifications', type: 'toggle', value: true },
        { name: 'Default OCR Engine', type: 'select', value: 'Google Vision', options: ['Google Vision', 'MediaPipe'] }
      ]
    },
    {
      title: 'Dietary Settings',
      settings: [
        { name: 'Dietary Restrictions', type: 'multiselect', value: ['Low Sodium', 'High Protein'] },
        { name: 'Calories Target', type: 'range', value: 2000, min: 1200, max: 3000 },
        { name: 'Allergies', type: 'tags', value: [] }
      ]
    },
    {
      title: 'Account',
      settings: [
        { name: 'Email', type: 'text', value: 'user@example.com' },
        { name: 'Password', type: 'password', value: '********' },
        { name: 'Delete Account', type: 'danger-button', value: 'Delete' }
      ]
    }
  ];

  return (
    <AppShell title="Settings">
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          {settingsGroups.map((group, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">{group.title}</h2>
              
              <div className="space-y-4">
                {group.settings.map((setting, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{setting.name}</p>
                      {setting.description && (
                        <p className="text-gray-500 text-sm">{setting.description}</p>
                      )}
                    </div>
                    
                    {setting.type === 'toggle' && (
                      <div className={`w-12 h-6 rounded-full transition-colors ${
                        setting.value ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform translate-y-[2px] ${
                          setting.value ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </div>
                    )}
                    
                    {setting.type === 'select' && (
                      <select className="border rounded-lg px-3 py-2">
                        {setting.options?.map((option, optIdx) => (
                          <option key={optIdx} selected={option === setting.value}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {setting.type === 'text' && (
                      <div className="text-gray-600">{setting.value}</div>
                    )}
                    
                    {setting.type === 'password' && (
                      <button className="text-blue-600 text-sm">Change</button>
                    )}
                    
                    {setting.type === 'danger-button' && (
                      <button className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm">
                        {setting.value}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>NutriFlow v1.0.0</p>
          <p>© 2023 NutriFlow. All rights reserved.</p>
        </div>
      </div>
    </AppShell>
  );
} 