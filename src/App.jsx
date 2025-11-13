import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ConversationDetail from './pages/ConversationDetail'
import CannedResponses from './pages/CannedResponses'
import ImportData from './pages/ImportData'
import CustomerPortal from './pages/CustomerPortal'

function RouterApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/c/:id" element={<ConversationDetail />} />
        <Route path="/canned" element={<CannedResponses />} />
        <Route path="/import" element={<ImportData />} />
        <Route path="/portal" element={<CustomerPortal />} />
        <Route path="/test" element={<div className="min-h-[60vh] flex items-center justify-center text-gray-600">Open the health check from the navbar.</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default RouterApp
