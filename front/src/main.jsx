import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@/styles/index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
      <App/>
  </ErrorBoundary>
)
