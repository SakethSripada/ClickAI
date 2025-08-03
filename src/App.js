/**
 * Main App Component for ClickAI Extension
 * 
 * This is the root component for the ClickAI browser extension popup interface.
 * It renders the main AIResponseAlert component in popup mode, providing users
 * with access to AI chat functionality directly from the extension popup.
 * 
 * The component is designed to be minimal and lightweight, serving primarily
 * as a container for the main chat interface when accessed via the extension
 * toolbar button.
 * 
 * @author Saketh Sripada
 * @version 1.0.0
 */

import React, { useRef } from 'react';
import AIResponseAlert from './Components/AIResponseAlert';
import './App.css';

/**
 * App Component
 * 
 * The main application component that serves as the entry point for the
 * extension popup. Renders the AI chat interface in popup mode with
 * appropriate configurations for the constrained popup environment.
 * 
 * @returns {JSX.Element} The rendered App component
 */
function App() {
  // Reference to the AIResponseAlert component for potential external control
  const aiResponseAlertRef = useRef(null);

  return (
    <div>
      {/* Main AI chat interface in popup mode - removes draggable/docking features */}
      <AIResponseAlert 
        ref={aiResponseAlertRef} 
        initialQuery="" 
        isPopup={true} 
      />
    </div>
  );
}

export default App;
