# Payment Success Page Design

## File Path: `pages/payment-success.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [countdown, setCountdown] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Handle countdown and redirect
  useEffect(() => {
    if (!session_id) return;
    
    setIsLoading(false);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/scan');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [session_id, router]);

  // Handle manual continue
  const handleContinue = () => {
    router.push('/scan');
  };

  return (
    <>
      <Head>
        <title>Payment Successful - NutriFlow</title>
        <meta name="description" content="Your payment was successful" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-[#14532D] to-[#0A4923] flex flex-col font-['Poppins',sans-serif]">
        <div className="w-full max-w-md mx-auto px-4 py-10 flex-1 flex flex-col items-center justify-center">
          
          {/* Success Card */}
          <div className="w-full backdrop-blur-xl rounded-lg border border-off-white/15 bg-off-white/20 p-6 text-center">
            
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-[#34A853] flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10 text-off-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            
            {/* Success Message */}
            <h1 className="text-2xl font-medium text-off-white mb-3">
              Payment Successful!
            </h1>
            
            {/* Subscription Details */}
            <p className="text-off-white/80 mb-5">
              Your subscription is now active. Get ready to unlock smarter meal choices and personalized nutrition insights.
            </p>
            
            {/* Divider */}
            <div className="w-16 h-px bg-off-white/20 mx-auto my-5"></div>
            
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2 my-4">
                <div className="w-3 h-3 rounded-full bg-[#84F7AC] animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-[#84F7AC] animate-pulse delay-100"></div>
                <div className="w-3 h-3 rounded-full bg-[#84F7AC] animate-pulse delay-200"></div>
                <span className="text-off-white/70 text-sm ml-2">Verifying payment...</span>
              </div>
            ) : (
              <>
                {/* What Happens Next */}
                <div className="mb-6">
                  <h2 className="text-off-white text-lg font-medium mb-2">What happens next?</h2>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#84F7AC] mr-2 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-off-white/80">Unlimited menu scans are now available</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#84F7AC] mr-2 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-off-white/80">All health goals are now unlocked</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#84F7AC] mr-2 mt-0.5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-off-white/80">You'll receive a confirmation email shortly</span>
                    </li>
                  </ul>
                </div>
                
                {/* Auto Redirect Message */}
                <p className="text-off-white/60 text-xs mb-5">
                  Redirecting you to the app in {countdown} seconds...
                </p>
                
                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  className="w-full h-12 rounded-lg bg-[#34A853] text-off-white font-medium hover:bg-[#2c9247] transition-colors flex items-center justify-center shadow-sm text-sm"
                >
                  Continue to App
                </button>
              </>
            )}
          </div>
          
          {/* Help Link */}
          <p className="text-off-white/50 text-xs mt-6">
            Need help? <a href="mailto:support@asknouri.com" className="text-[#84F7AC]">Contact support</a>
          </p>
        </div>
      </div>
    </>
  );
}
```

## Styling Notes:

1. **Color Scheme**: 
   - Background gradient: `from-[#14532D] to-[#0A4923]` (dark green)
   - Accent colors: `#34A853` (button green), `#84F7AC` (bright green for checkmarks and highlights)
   - Text: `text-off-white` with opacity variations for hierarchy

2. **UI Elements**:
   - Success icon: Large checkmark in a green circle
   - Card with `backdrop-blur-xl` effect
   - Clean, readable typography
   - Countdown timer for automatic redirect
   - Manual continue button
   - Loading states

3. **Functionality**:
   - Handles the Stripe `session_id` parameter
   - Countdown timer with auto-redirect to the app
   - Manual continue button
   - Responsive design

## Implementation Steps:

1. Create the file at `pages/payment-success.tsx`
2. Copy the code above
3. Make sure the text-off-white class is defined in your CSS
4. Ensure paths like `/scan` match your actual app navigation
5. Test with a Stripe checkout flow 