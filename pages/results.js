import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import Button from '../components/ui/Button';

// Restaurant card component
const RestaurantCard = ({ restaurantName, location, timestamp, score, menuImage }) => {
  // Use the provided menu image or fallback to a gray background
  const menuImageUrl = menuImage || null;

  return (
    <div className="rounded-2xl overflow-hidden relative">
      <div className="relative h-48">
        {/* Scanned menu image as background */}
        {menuImageUrl ? (
          <img 
            src={menuImageUrl} 
            alt="Scanned menu"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: "#4a4a4a",
              backgroundImage: "linear-gradient(to bottom, rgba(80,80,80,1), rgba(45,45,45,1))"
            }}
          />
        )}
        
        {/* Dark gradient overlay for better text visibility */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8))"
          }}
        />
        
        {/* Small image icon to indicate it's a scanned menu */}
        <div className="absolute top-4 left-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-200">
            <rect x="2" y="2" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <rect x="2" y="2" width="3" height="3" fill="currentColor" />
            <rect x="4" y="10" width="16" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        
        {/* Restaurant info */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="pt-8">
            <h3 className="text-3xl font-bold text-white">{restaurantName}</h3>
            <p className="text-xl text-gray-300">{location}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-lg text-white">{timestamp}</span>
            <span className="text-xl text-green-300 font-bold">{score}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dish card component
const DishCard = ({ dish, category }) => {
  // Generate progress bar colors based on macro type
  const getMacroBarColor = (macroType) => {
    switch (macroType) {
      case 'calories': return 'bg-green-400';
      case 'carbs': return 'bg-amber-400';
      case 'protein': return 'bg-purple-400';
      case 'fat': return 'bg-indigo-400';
      case 'sugar': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className={`rounded-2xl overflow-hidden border-0 ${category === "Healthiest" ? "bg-green-100" : "bg-white"}`} 
      style={category === "Healthiest" ? 
        {backgroundColor: "hsl(140.6, 84.2%, 92.5%)", border: "none", boxShadow: "none"} : 
        {border: "none", boxShadow: "none"}
      }>
      <CardContent className="p-6 pb-6 pt-6">
        {/* Category text above dish name */}
        {category && (
          <div className="mb-0">
            <span className="text-sm text-green-700 font-medium">
              {category}
            </span>
          </div>
        )}
        
        {/* Dish name and price in same row */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-semibold text-gray-800 leading-none">{dish.name}</h2>
          <span className="text-2xl font-semibold text-gray-800 leading-none">${dish.price}</span>
        </div>
        
        {/* Description in secondary size */}
        <p className="text-sm text-gray-600 mb-5">
          {dish.summaryBenefits}
        </p>
        
        {/* Macro nutrients section with progress bars */}
        <div className="mb-3">
          {/* Macro labels */}
          <div className="grid grid-cols-5 gap-x-1 mb-1">
            <span className="text-xs uppercase text-gray-500 block text-center">CALS</span>
            <span className="text-xs uppercase text-gray-500 block text-center">CARBS</span>
            <span className="text-xs uppercase text-gray-500 block text-center">PROTEIN</span>
            <span className="text-xs uppercase text-gray-500 block text-center">FAT</span>
            <span className="text-xs uppercase text-gray-500 block text-center">SUGAR</span>
          </div>
          
          {/* Bars only */}
          <div className="grid grid-cols-5 gap-x-1 mb-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: dish.macros.carbs === 'High' ? '85%' : dish.macros.carbs === 'Mid' ? '50%' : '25%' }}
              ></div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 rounded-full" 
                style={{ width: dish.macros.protein === 'High' ? '85%' : dish.macros.protein === 'Mid' ? '50%' : '25%' }}
              ></div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-400 rounded-full" 
                style={{ width: dish.macros.fat === 'High' ? '85%' : dish.macros.fat === 'Mid' ? '50%' : '25%' }}
              ></div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-400 rounded-full" 
                style={{ width: dish.macros.sugar === 'High' ? '85%' : dish.macros.sugar === 'Mid' ? '50%' : '25%' }}
              ></div>
            </div>
          </div>
          
          {/* Macro values */}
          <div className="grid grid-cols-5 gap-x-1">
            <span className="text-xs text-gray-600 block text-center">{dish.calories}</span>
            <span className="text-xs text-gray-600 block text-center">{dish.macros.carbs}</span>
            <span className="text-xs text-gray-600 block text-center">{dish.macros.protein}</span>
            <span className="text-xs text-gray-600 block text-center">{dish.macros.fat}</span>
            <span className="text-xs text-gray-600 block text-center">{dish.macros.sugar}</span>
          </div>
        </div>
        
        <Separator className="my-3 bg-gray-200" />
        
        {/* Health prediction section */}
        <div>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-bold">Health Prediction:</span> {dish.healthPrediction}
          </p>
          
          {/* Score as a normal element with right alignment */}
          <div className="flex justify-end">
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full inline-block font-medium">
              Health Score: {dish.score}/100
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Recommendation component
const RecommendationCard = ({ recommendation }) => {
  return (
    <div className="rounded-2xl" style={{ backgroundColor: "hsl(60, 4.8%, 95.9%)" }}>
      <div className="px-6 py-3">
        <div className="mb-2">
          <span className="text-sm text-green-700 font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Today's Recommendation
          </span>
        </div>
        
        <p className="text-sm text-gray-700">
          {recommendation}
        </p>
      </div>
    </div>
  );
};

export default function Results() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Parse query params
  useEffect(() => {
    if (!router.isReady) return;
    
    try {
      // Sample data structure - if using mock data before integration
      const mockData = {
        dishes: [
          {
            name: "Mizo Glazed Bowl",
            price: "22",
            score: 85,
            category: "Healthiest",
            calories: 520,
            macros: {
              protein: "High",
              carbs: "High",
              fat: "Mid",
              sugar: "Low"
            },
            summaryBenefits: "High in omega-3 fatty acids with anti-inflammatory benefits. Supports your protein needs.",
            healthPrediction: "Rich in omega-3. Expect mental clarity and calm post-dinner"
          },
          {
            name: "Chicken Teriyaki Bowl",
            price: "18",
            score: 75,
            category: "Balanced",
            calories: 650,
            macros: {
              protein: "High",
              carbs: "Mid",
              fat: "Mid",
              sugar: "Mid"
            },
            summaryBenefits: "Good source of lean protein with moderate carbs for energy.",
            healthPrediction: "Balanced meal that should keep you satisfied for 3-4 hours."
          },
          {
            name: "Chocolate Lava Cake",
            price: "8.99",
            score: 40,
            category: "Indulgent",
            calories: 650,
            macros: {
              protein: "Low",
              carbs: "High",
              fat: "High",
              sugar: "High"
            },
            summaryBenefits: "Great for occasional indulgence. Rich in antioxidants from dark chocolate.",
            healthPrediction: "May cause quick energy boost followed by a slump in 1-2 hours."
          }
        ],
        averageMenuScore: 60,
        userGoal: "Balanced Nutrition",
        restaurantName: "SOHO Toronto",
        location: "Toronto Downtown",
        timestamp: "Apr 1, 2025 – 9:11 PM",
        recommendation: "Focus on a nutrient dense whole food diet today will help you maintain energy and focus.",
        scannedMenuImage: "https://via.placeholder.com/400x600?text=SOHO+Toronto+Menu" // Using a placeholder image until real scanning is implemented
      };
    
      // For development, always use mock data
      // In production, use the passed data if available
      if (process.env.NODE_ENV === 'development') {
        setData(mockData);
      } else if (router.query.data) {
        setData(JSON.parse(router.query.data));
      } else {
        // Fallback to mockData in production if no data is provided
        setData(mockData);
      }
    } catch (err) {
      console.error('Error parsing data:', err);
    } finally {
      setLoading(false);
    }
  }, [router.isReady, router.query]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#12372D]">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-white/30 border-t-white"></div>
        <p className="ml-4 text-white text-sm">Analyzing your menu...</p>
      </div>
    );
  }
  
  // Error state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#12372D] p-4">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">No Results Found</h1>
        <p className="text-white mb-6 text-center text-sm">We couldn't process your menu. Please try again.</p>
        <Button 
          variant="secondary"
          size="lg"
          onClick={() => router.push('/')}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Get healthiest dish
  const healthiestDish = data?.dishes?.find(dish => dish.category === "Healthiest");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(164.2, 85.7%, 16.5%)" }}>
      <main className="max-w-sm mx-auto px-4 py-4 flex flex-col gap-y-3">
        {/* Header with Last Scan info */}
        <header className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-white">Your Last Scan</h1>
          <a href="/history" className="text-green-300 text-sm">View History</a>
        </header>
        
        {/* White rounded container */}
        <Card className="bg-white rounded-2xl overflow-hidden p-4 shadow-md">
          <div className="flex flex-col gap-y-4">
            {/* Restaurant card */}
            <RestaurantCard 
              restaurantName={data?.restaurantName || 'Restaurant'} 
              location={data?.location || 'Location'} 
              timestamp={data?.timestamp || 'Today'}
              score={data?.averageMenuScore || '--'}
              menuImage={data?.scannedMenuImage}
            />
            
            {/* Dish Card with category passed in */}
            {healthiestDish && <DishCard dish={healthiestDish} category="Healthiest" />}
            
            {/* Today's Recommendation */}
            <RecommendationCard recommendation={data?.recommendation || 'Focus on nutritionally balanced meals today.'} />
          </div>
        </Card>
      </main>
      
      {/* Footer */}
      <footer className="py-4 px-4">
        <div className="max-w-sm mx-auto">
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-full shadow-md"
            onClick={() => router.push('/')}
          >
            Scan Another Menu
          </Button>
        </div>
      </footer>
    </div>
  );
} 