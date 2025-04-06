import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getAppCheck } from './firebase/appCheck'

// Initialize App Check early to ensure it's ready for all Firebase operations
if (import.meta.env.PROD) {
  getAppCheck();
} else {
  // In development, initialize with debug mode
  console.log('Initializing Firebase App Check in debug mode');
  getAppCheck();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
