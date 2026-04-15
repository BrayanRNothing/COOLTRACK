import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './app/providers/AuthProvider'
import { WorkDataProvider } from './app/providers/WorkDataProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WorkDataProvider>
          <App />
        </WorkDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
