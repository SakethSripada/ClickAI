import React, { useRef } from 'react';
import AIResponseAlert from './Components/AIResponseAlert';
import './App.css';

function App() {
  const aiResponseAlertRef = useRef(null);

  return (
    <div>
      {/* In popup mode we pass isPopup=true */}
      <AIResponseAlert ref={aiResponseAlertRef} initialQuery="" isPopup={true} />
    </div>
  );
}

export default App;
