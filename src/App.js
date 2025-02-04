import React, { useRef } from 'react';
import AIResponseAlert from './AIResponseAlert';
import './App.css';

function App() {
  const aiResponseAlertRef = useRef(null);

  return (
    <div>
      <AIResponseAlert ref={aiResponseAlertRef} initialQuery="" />
    </div>
  );
}

export default App;
