import React from 'react';
import AppShell from '../components/layout/AppShell';
import Link from 'next/link';

export default function HistoryPage() {
  // Sample history data
  const scanHistory = [
    {
      id: '1',
      date: 'April 5, 2023',
      restaurant: 'The Local Bistro',
      items: 12,
      time: '8:24 PM'
    },
    {
      id: '2',
      date: 'March 28, 2023',
      restaurant: 'Green Garden Cafe',
      items: 8,
      time: '12:15 PM'
    },
    {
      id: '3',
      date: 'March 22, 2023',
      restaurant: 'Taste of Italy',
      items: 15,
      time: '7:45 PM'
    }
  ];
  
  return (
    <AppShell title="Scan History">
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Your Scan History</h1>
        
        {scanHistory.length > 0 ? (
          <div className="space-y-4">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{scan.restaurant}</h3>
                    <p className="text-gray-600 text-sm">{scan.date} · {scan.time}</p>
                  </div>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    {scan.items} items
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-between">
                  <Link href={`/results?id=${scan.id}`}>
                    <a className="text-green-600 text-sm font-medium">View Results</a>
                  </Link>
                  <button className="text-gray-400 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">You haven't scanned any menus yet.</p>
            <Link href="/">
              <a className="inline-block bg-green-600 text-white py-2 px-4 rounded-lg font-medium">
                Scan Your First Menu
              </a>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
} 