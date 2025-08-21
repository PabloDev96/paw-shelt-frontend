import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fullcalendar/daygrid/index.css';
import '@fullcalendar/timegrid/index.css';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
