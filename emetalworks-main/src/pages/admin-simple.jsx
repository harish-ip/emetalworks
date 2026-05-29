import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardSimple() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Admin Dashboard - Simple Test</h1>
      <p>If you can see this, the routing is working!</p>
      <button onClick={() => navigate('/')} style={{ padding: '10px 20px', margin: '10px' }}>
        Back to Home
      </button>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Test Information:</h2>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>React Router:</strong> Working ✅</p>
        <p><strong>Admin Component:</strong> Loading ✅</p>
      </div>
    </div>
  );
}
