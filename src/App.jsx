import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/index.jsx';
import AdminDashboard from './pages/admin.jsx';
import AdminDashboardSimple from './pages/admin-simple.jsx';
import AdminDashboardMinimal from './pages/admin-minimal.jsx';
import './index.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-full" element={<AdminDashboard />} />
          <Route path="/test" element={<div style={{padding: '20px'}}><h1>Test Route Works!</h1><a href="/">Back to Home</a></div>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;