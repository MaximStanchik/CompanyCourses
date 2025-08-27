import React, { useState, useEffect } from 'react';
import useTheme from '../hooks/useTheme';

const AuthDebugger = () => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        setTokenInfo({
          token: token.substring(0, 20) + '...',
          decoded,
          isExpired: decoded.exp < currentTime,
          expiresIn: Math.round(decoded.exp - currentTime),
          currentTime: Math.round(currentTime)
        });
      } catch (error) {
        setTokenInfo({ error: error.message });
      }
    } else {
      setTokenInfo({ error: 'No token found' });
    }
  }, []);

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '200px',
          zIndex: 9999,
          padding: '10px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Auth Debug
      </button>
      
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '200px',
          zIndex: 9998,
          width: '300px',
          background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
          borderRadius: '8px',
          padding: '15px',
          fontSize: '12px',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#dc3545' }}>
            Auth Debugger
          </h4>
          
          {tokenInfo ? (
            <div>
              {tokenInfo.error ? (
                <div style={{ color: '#dc3545' }}>
                  <strong>Error:</strong> {tokenInfo.error}
                </div>
              ) : (
                <div>
                  <div><strong>Token:</strong> {tokenInfo.token}</div>
                  <div><strong>User ID:</strong> {tokenInfo.decoded.id}</div>
                  <div><strong>Roles:</strong> {tokenInfo.decoded.roles?.join(', ') || 'None'}</div>
                  <div><strong>Expires:</strong> {new Date(tokenInfo.decoded.exp * 1000).toLocaleString()}</div>
                  <div><strong>Expires in:</strong> {tokenInfo.expiresIn} seconds</div>
                  <div style={{ 
                    color: tokenInfo.isExpired ? '#dc3545' : '#28a745',
                    fontWeight: 'bold'
                  }}>
                    Status: {tokenInfo.isExpired ? 'EXPIRED' : 'VALID'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default AuthDebugger; 