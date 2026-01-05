import React from 'react';
import AuroraBorealis from './components/Aurora';

function App() {
  return (
    <div>
      <AuroraBorealis />
      
      {/* Your content goes here */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        color:  'white',
        padding: '2rem',
        minHeight: '100vh',
        display:  'flex',
        alignItems:  'center',
        justifyContent:  'center'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          textShadow: '0 0 20px rgba(0, 255, 128, 0.5)' 
        }}>
          Aurora Borealis
        </h1>
      </div>
    </div>
  );
}

export default App;