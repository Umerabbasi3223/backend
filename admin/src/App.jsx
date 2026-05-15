import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Components/Navbar/Navbar'
import Admin from './Pages/Admin/Admin'
import './App.css'

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* All admin routes go through the Admin component */}
        <Route path="/*" element={<Admin />} />
      </Routes>
    </div>
  )
}

export default App