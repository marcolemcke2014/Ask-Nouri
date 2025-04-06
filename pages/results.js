import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Results() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Parse query params
  useEffect(() => {
    if (!router.isReady) return;
    
    try {
      if (router.query.data) {
        setData(JSON.parse(router.query.data));
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <p>Loading results...</p>
      </div>
    );
  }
  
  // Error state
  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem' 
        }}>
          No Results Found
        </h1>
        <a 
          href="/" 
          style={{
            display: 'inline-block',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}
        >
          Try Again
        </a>
      </div>
    );
  }
  
  // Get score colors
  const getScoreColor = (score) => {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <a 
            href="/" 
            style={{
              color: '#3b82f6',
              textDecoration: 'none'
            }}
          >
            Back to Home
          </a>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            margin: 0
          }}>
            Results
          </h1>
          <div style={{ width: '5rem' }}></div>
        </div>
      </header>
      
      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '1rem',
        maxWidth: '768px',
        width: '100%',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          Recommended Dishes
        </h2>
        
        {data.analysis.map((item, index) => (
          <div 
            key={index} 
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '1rem',
              padding: '1rem'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '500',
                margin: 0
              }}>
                {item.name}
              </h3>
              <span style={{ 
                fontWeight: 'bold',
                color: getScoreColor(item.score)
              }}>
                {item.score}/10
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              {item.tags.map((tag, i) => (
                <span 
                  key={i} 
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}
                >
                  {tag}
                </span>
              ))}
              
              {item.flags.map((flag, i) => (
                <span 
                  key={i} 
                  style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem'
                  }}
                >
                  ⚠️ {flag}
                </span>
              ))}
            </div>
            
            {item.improvements.length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  marginBottom: '0.25rem'
                }}>
                  Suggestions:
                </h4>
                <ul style={{ 
                  listStyleType: 'disc',
                  paddingLeft: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}>
                  {item.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </main>
      
      {/* Footer */}
      <footer style={{
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <a 
            href="/" 
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 'medium',
              textAlign: 'center'
            }}
          >
            Scan Another Menu
          </a>
        </div>
      </footer>
    </div>
  );
} 