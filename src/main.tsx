import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { DictionaryProvider } from '@/contexts/DictionaryContext'

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <DictionaryProvider>
      <App />
    </DictionaryProvider>
  </HelmetProvider>
);
