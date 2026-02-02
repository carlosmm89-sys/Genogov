import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('QR Laboral: Script starting...');
const rootElement = document.getElementById('qrlaboral-root');
console.log('QR Laboral: Root element found:', rootElement);

createRoot(rootElement || document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
