import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

const QUOTE_CONFIG = {
  materialRates: {
    steel: 68,
    stainless: 275
  },
  fabricationRates: {
    steel: 105,
    stainless: 160
  },
  finishingRates: {
    steel: 45,
    stainless: 20
  },
  installationRates: {
    window: 55,
    security: 70,
    decorative: 85,
    balcony: 95,
    gate: 120,
    staircase: 120
  },
  complexity: {
    window: 1,
    security: 1.3,
    decorative: 1.5,
    balcony: 1.2,
    gate: 1.4,
    staircase: 1.6
  },
  profileWeights: {
    rod_8mm: 0.39,
    rod_10mm: 0.62,
    rod_12mm: 0.89,
    square: 1.15,
    round: 0.89,
    angle: 1.12
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [dashboardData, setDashboardData] = useState({
    totalVisits: 245,
    totalContacts: 38,
    conversionRate: 15.5,
    recentContacts: [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@example.com',
        phone: '9876543210',
        subject: 'Steel Gate Quote',
        message: 'Need a quote for main gate fabrication',
        createdAt: new Date().toISOString(),
        status: 'new'
      },
      {
        id: 2,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '8765432109',
        subject: 'Window Grills',
        message: 'Looking for security grills for 4 windows',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'contacted'
      },
      {
        id: 3,
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        phone: '7654321098',
        subject: 'Balcony Railing',
        message: 'Need decorative railing for balcony',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ]
  });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedContact, setSelectedContact] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    workType: 'window',
    material: 'steel',
    width: '4',
    height: '4',
    quantity: '1',
    profile: 'rod_10mm',
    spacing: '4',
    wastage: '7',
    finishingRate: '45',
    installRate: '55',
    extraCost: '0',
    minimumCharge: '2500'
  });

  const calculateAdminQuote = () => {
    const width = parseFloat(quoteForm.width) || 0;
    const height = parseFloat(quoteForm.height) || 0;
    const quantity = parseInt(quoteForm.quantity, 10) || 1;
    const areaSqFt = width * height * quantity;
    const profileWeight = QUOTE_CONFIG.profileWeights[quoteForm.profile] || 1.15;
    const materialRate = QUOTE_CONFIG.materialRates[quoteForm.material] || 68;
    const fabricationRate = QUOTE_CONFIG.fabricationRates[quoteForm.material] || 105;
    const complexity = QUOTE_CONFIG.complexity[quoteForm.workType] || 1;
    const wastagePercent = parseFloat(quoteForm.wastage) || 0;
    const finishingRate = parseFloat(quoteForm.finishingRate) || 0;
    const installRate = parseFloat(quoteForm.installRate) || 0;
    const extraCost = parseFloat(quoteForm.extraCost) || 0;
    const minimumCharge = parseFloat(quoteForm.minimumCharge) || 0;

    let linearMeters = 0;

    if (quoteForm.workType === 'window') {
      const verticalBars = Math.max(2, Math.ceil((width * 12) / (parseFloat(quoteForm.spacing) || 4)));
      const horizontalBars = Math.max(3, Math.ceil((height * 12) / 12));
      const rodLengthFt = (verticalBars * height + horizontalBars * width) * quantity;
      const frameLengthFt = 2 * (width + height) * quantity;
      linearMeters = (rodLengthFt + frameLengthFt) * 0.3048;
    } else {
      const linearFactor = {
        security: 10,
        decorative: 8,
        balcony: 7,
        gate: 12,
        staircase: 9
      }[quoteForm.workType] || 7;
      linearMeters = areaSqFt * 0.092903 * linearFactor;
    }

    const baseWeight = linearMeters * profileWeight;
    const wastageWeight = baseWeight * (wastagePercent / 100);
    const totalWeight = baseWeight + wastageWeight;
    const materialCost = totalWeight * materialRate;
    const fabricationCost = totalWeight * fabricationRate * complexity;
    const finishingCost = areaSqFt * finishingRate;
    const installationCost = areaSqFt * installRate;
    const subtotal = materialCost + fabricationCost + finishingCost + installationCost + extraCost;
    const total = Math.max(minimumCharge, subtotal);

    return {
      areaSqFt,
      linearMeters,
      totalWeight,
      materialCost,
      fabricationCost,
      finishingCost,
      installationCost,
      extraCost,
      subtotal,
      total
    };
  };

  const adminQuote = calculateAdminQuote();

  // Check if already authenticated
  useEffect(() => {
    console.log('useEffect: Checking authentication...');
    const token = localStorage.getItem('admin_token');
    console.log('useEffect: Token found:', !!token);
    if (token) {
      console.log('useEffect: Setting authenticated to true');
      setIsAuthenticated(true);
      loadDashboardData(); // Load dashboard data on authentication
      loadContacts(); // Load contacts data on authentication
    } else {
      console.log('useEffect: No token, staying unauthenticated');
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login successful, setting authenticated to true');
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        console.log('Authentication state should now be true');
        loadDashboardData(); // Load dashboard data after successful login
        loadContacts(); // Load contacts data after successful login
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
  setLoading(true);
  console.log('Loading dashboard data from API...');

  try {
    const token = localStorage.getItem('admin_token');

    // Load dashboard stats
    const dashboardResponse = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Load contact submissions
    const contactsResponse = await fetch(`${API_BASE_URL}/api/contact/submissions`);

    const dashboardData = await dashboardResponse.json();
    const contactsData = await contactsResponse.json();

    console.log('Dashboard API response:', dashboardData);
    console.log('Contacts API response:', contactsData);

    if (dashboardData.success && contactsData.success) {
      const submissions = contactsData.data.submissions || [];

      // Update dashboard data with real contact count
      const updatedDashboardData = {
        ...dashboardData.data,
        totalContacts: submissions.length,
        recentContacts: submissions.slice(-5).reverse() // Show 5 most recent
      };

      console.log('Setting dashboard data:', updatedDashboardData);
      console.log('Setting contacts data:', submissions);
      console.log('First contact sample:', submissions[0]);
      if (submissions[0]) {
        console.log('Calculator data in first contact:', submissions[0].calculatorData);
      }
      setDashboardData(updatedDashboardData);
      setContacts(submissions);
    } else {
      setError('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    setError('Dashboard API not available - using demo mode');
    // Set demo data for development
    setDashboardData({
      totalVisits: 0,
      totalContacts: 0,
      conversionRate: 0,
      recentContacts: []
    });
  } finally {
    setLoading(false);
  }
};

  const loadContacts = async () => {
    setLoading(true);
    console.log('Loading contacts from API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/submissions`);
      const data = await response.json();

      if (data.success && data.data.submissions) {
        console.log('✅ Contacts loaded successfully:', data.data.submissions.length);
        console.log('✅ First contact sample:', data.data.submissions[0]);
        setContacts(data.data.submissions);
      } else {
        console.error('❌ Failed to load contacts:', data.message);
        setContacts([]);
      }
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      setContacts([]);
    }

    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setDashboardData(null);
    setContacts([]);
  };

  const updateContactStatus = async (contactId, status) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/contact/submission/${contactId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadContacts(); // Reload contacts
      }
    } catch (error) {
      console.error('Failed to update contact status:', error);
    }
  };

  const addAdminNote = async (contactId) => {
    if (!adminNote.trim()) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/contact/submission/${contactId}/note`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: adminNote })
      });

      if (response.ok) {
        setAdminNote('');
        loadContacts(); // Reload contacts
      }
    } catch (error) {
      console.error('Failed to add admin note:', error);
    }
  };

  const exportContacts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/admin/export/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export contacts:', error);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesSearch = !searchTerm ||
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  console.log('Render: isAuthenticated =', isAuthenticated);
  console.log('Render: activeView =', activeView);
  console.log('Render: dashboardData =', dashboardData);

  if (!isAuthenticated) {
    console.log('Render: Showing login form');
    return (
      <div className="min-h-screen bg-gradient-to-br from-steel-50 to-steel-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <CardTitle className="text-center mb-6">Admin Login</CardTitle>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FULL DASHBOARD INTERFACE
  console.log('Render: Showing full dashboard interface');
  return (
    <div className="min-h-screen bg-gradient-to-br from-steel-50 to-steel-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-steel-900">eMetalWorks Admin</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-sm"
            >
              ← Back to Site
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('admin_token');
                setIsAuthenticated(false);
                setActiveView('dashboard');
                setDashboardData(null);
                setContacts([]);
              }}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              🚪 Logout
            </Button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => {
              setActiveView('dashboard');
              loadDashboardData(); // Refresh data when switching to dashboard
            }}
            className="flex items-center gap-2"
          >
            📊 Dashboard
          </Button>
          <Button
            variant={activeView === 'contacts' ? 'default' : 'outline'}
            onClick={() => {
              setActiveView('contacts');
              loadContacts(); // Refresh contacts when switching to contacts view
            }}
            className="flex items-center gap-2"
          >
            📋 Contacts
          </Button>
          <Button
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            onClick={() => {
              setActiveView('analytics');
              loadDashboardData(); // Refresh data when switching to analytics
            }}
            className="flex items-center gap-2"
          >
            📈 Analytics
          </Button>
          <Button
            variant={activeView === 'quotation' ? 'default' : 'outline'}
            onClick={() => setActiveView('quotation')}
            className="flex items-center gap-2"
          >
            Quotation Ref
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              loadDashboardData();
              loadContacts();
            }}
            className="flex items-center gap-2 text-green-600 hover:text-green-700"
            title="Refresh all data"
          >
            🔄 Refresh
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-steel-600">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Dashboard View */}
        {console.log('Render check - activeView:', activeView, 'dashboardData:', dashboardData)}
        {activeView === 'dashboard' && !dashboardData && !loading && (
          <div className="text-center py-8">
            <div className="text-steel-600">No dashboard data available. Click "📊 Dashboard" to reload.</div>
          </div>
        )}
        {activeView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-steel-600">Total Visits</p>
                      <p className="text-3xl font-bold text-steel-900">{dashboardData.totalVisits}</p>
                    </div>
                    <div className="text-blue-600">👥</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-steel-600">Total Contacts</p>
                      <p className="text-3xl font-bold text-steel-900">{dashboardData.totalContacts}</p>
                    </div>
                    <div className="text-green-600">📧</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-steel-600">Conversion Rate</p>
                      <p className="text-3xl font-bold text-steel-900">{dashboardData.conversionRate}%</p>
                    </div>
                    <div className="text-purple-600">📈</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-steel-600">Active Projects</p>
                      <p className="text-3xl font-bold text-steel-900">12</p>
                    </div>
                    <div className="text-orange-600">🔧</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Contacts */}
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Recent Contacts</CardTitle>
                <div className="space-y-4">
                  {dashboardData.recentContacts && dashboardData.recentContacts.length > 0 ? (
                    dashboardData.recentContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 bg-steel-50 rounded-lg">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-steel-600">{contact.subject}</p>
                          <p className="text-xs text-steel-500">{new Date(contact.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.status}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-steel-600">No recent contacts</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contacts View */}
        {activeView === 'contacts' && (
          <div className="space-y-6">
            {/* Contacts Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Contact Management</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-steel-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="completed">Completed</option>
                </select>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-steel-500 focus:border-transparent"
                />
                <Button onClick={exportContacts} className="whitespace-nowrap">
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="grid gap-4">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Contact Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-semibold text-steel-900">{contact.name}</h3>
                              <p className="text-steel-600">{contact.email}</p>
                              {contact.phone && <p className="text-steel-600">{contact.phone}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {contact.status}
                              </span>
                              <span className="text-xs text-steel-500">
                                {new Date(contact.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Contact Details */}
                          <div className="space-y-2">
                            {contact.subject && (
                              <div>
                                <span className="text-sm font-medium text-steel-700">Subject: </span>
                                <span className="text-sm text-steel-600">{contact.subject}</span>
                              </div>
                            )}
                            {contact.projectType && (
                              <div>
                                <span className="text-sm font-medium text-steel-700">Project Type: </span>
                                <span className="text-sm text-steel-600">{contact.projectType}</span>
                              </div>
                            )}
                            {contact.message && (
                              <div>
                                <span className="text-sm font-medium text-steel-700">Message: </span>
                                <p className="text-sm text-steel-600 mt-1">{contact.message}</p>
                              </div>
                            )}
                          </div>

                          {/* Calculator Data */}
                          {contact.calculatorData && (
                            <div className="mt-4 p-4 bg-steel-50 rounded-lg">
                              <h4 className="text-sm font-medium text-steel-700 mb-2">Calculator Data:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                {contact.calculatorData.dimensions && (
                                  <div>
                                    <span className="font-medium">Dimensions: </span>
                                    {contact.calculatorData.dimensions.width} × {contact.calculatorData.dimensions.height}
                                    {contact.calculatorData.dimensions.widthUnit || 'ft'} × {contact.calculatorData.dimensions.heightUnit || 'ft'}
                                  </div>
                                )}
                                {contact.calculatorData.grillType && (
                                  <div>
                                    <span className="font-medium">Grill Type: </span>
                                    {contact.calculatorData.grillType}
                                  </div>
                                )}
                                {contact.calculatorData.metalType && (
                                  <div>
                                    <span className="font-medium">Metal Type: </span>
                                    {contact.calculatorData.metalType}
                                  </div>
                                )}
                                {contact.calculatorData.profileType && (
                                  <div>
                                    <span className="font-medium">Profile: </span>
                                    {contact.calculatorData.profileType}
                                  </div>
                                )}
	                                {contact.calculatorData.quantity && (
	                                  <div>
	                                    <span className="font-medium">Quantity: </span>
	                                    {contact.calculatorData.quantity}
	                                  </div>
	                                )}
                                {contact.calculatorData.estimatedWeight && (
                                  <div>
                                    <span className="font-medium">Weight: </span>
                                    {Math.round(contact.calculatorData.estimatedWeight)} kg
                                  </div>
                                )}
                                {contact.calculatorData.estimatedCost && (
                                  <div>
                                    <span className="font-medium">Cost: </span>
                                    ₹{Math.round(contact.calculatorData.estimatedCost)}
                                  </div>
                                )}
                                {contact.calculatorData.calculatorType && (
                                  <div>
                                    <span className="font-medium">Calculator: </span>
                                    {contact.calculatorData.calculatorType}
                                  </div>
                                )}
                              </div>

                              {/* Rod Calculation Details */}
                              {contact.calculatorData.rodCalculation && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <h5 className="text-sm font-medium text-green-800 mb-2">Rod Configuration:</h5>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div>
                                      <span className="font-medium text-green-700">Vertical Rods: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.verticalRods}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">Horizontal Rods: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.horizontalRods}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">Rod Diameter: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.rodDiameter}mm</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">Vertical Length: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.verticalRodLength}ft</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">Horizontal Length: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.horizontalRodLength}ft</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-700">Total Length: </span>
                                      <span className="text-green-600">{contact.calculatorData.rodCalculation.totalRodLength}ft</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Admin Notes */}
                          {contact.adminNote && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <span className="text-sm font-medium text-yellow-700">Admin Note: </span>
                              <p className="text-sm text-yellow-600 mt-1">{contact.adminNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-steel-500">No contacts found matching your criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && dashboardData && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Analytics Overview</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Conversion Funnel</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Visits</span>
                        <span>{dashboardData.totalVisits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contacts</span>
                        <span>{dashboardData.totalContacts}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Conversion Rate</span>
                        <span>{dashboardData.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Performance Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Avg. Response Time</span>
                        <span>2.5 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Satisfaction</span>
                        <span>4.8/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Project Completion</span>
                        <span>95%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'quotation' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Advanced Quotation Calculator</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-steel-700 mb-2">Work Type</label>
                    <select
                      value={quoteForm.workType}
                      onChange={(e) => setQuoteForm({ ...quoteForm, workType: e.target.value })}
                      className="w-full px-3 py-2 border border-steel-300 rounded-lg bg-white"
                    >
                      <option value="window">Window Grills</option>
                      <option value="security">Security Grills</option>
                      <option value="decorative">Decorative Grills</option>
                      <option value="balcony">Balcony Railings</option>
                      <option value="gate">Gate Grills</option>
                      <option value="staircase">Staircase Railings</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-steel-700 mb-2">Material</label>
                    <select
                      value={quoteForm.material}
                      onChange={(e) => setQuoteForm({ ...quoteForm, material: e.target.value })}
                      className="w-full px-3 py-2 border border-steel-300 rounded-lg bg-white"
                    >
                      <option value="steel">Mild Steel</option>
                      <option value="stainless">Stainless Steel 304</option>
                    </select>
                  </div>
                  <Input label="Width (ft)" type="number" step="0.1" value={quoteForm.width} onChange={(e) => setQuoteForm({ ...quoteForm, width: e.target.value })} />
                  <Input label="Height (ft)" type="number" step="0.1" value={quoteForm.height} onChange={(e) => setQuoteForm({ ...quoteForm, height: e.target.value })} />
                  <Input label="Quantity" type="number" min="1" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })} />
                  <div>
                    <label className="block text-sm font-medium text-steel-700 mb-2">Profile</label>
                    <select
                      value={quoteForm.profile}
                      onChange={(e) => setQuoteForm({ ...quoteForm, profile: e.target.value })}
                      className="w-full px-3 py-2 border border-steel-300 rounded-lg bg-white"
                    >
                      <option value="rod_8mm">8mm Round Rod</option>
                      <option value="rod_10mm">10mm Round Rod</option>
                      <option value="rod_12mm">12mm Round Rod</option>
                      <option value="square">20x20x2mm Square Pipe</option>
                      <option value="round">20mm Round Pipe</option>
                      <option value="angle">25x25x3mm Angle</option>
                    </select>
                  </div>
                  <Input label="Bar Spacing (in)" type="number" step="0.5" value={quoteForm.spacing} onChange={(e) => setQuoteForm({ ...quoteForm, spacing: e.target.value })} />
                  <Input label="Wastage (%)" type="number" step="1" value={quoteForm.wastage} onChange={(e) => setQuoteForm({ ...quoteForm, wastage: e.target.value })} />
                  <Input label="Finish Rate (Rs/sq.ft)" type="number" step="5" value={quoteForm.finishingRate} onChange={(e) => setQuoteForm({ ...quoteForm, finishingRate: e.target.value })} />
                  <Input label="Install Rate (Rs/sq.ft)" type="number" step="5" value={quoteForm.installRate} onChange={(e) => setQuoteForm({ ...quoteForm, installRate: e.target.value })} />
                  <Input label="Extra Cost (Rs)" type="number" step="100" value={quoteForm.extraCost} onChange={(e) => setQuoteForm({ ...quoteForm, extraCost: e.target.value })} />
                  <Input label="Minimum Charge (Rs)" type="number" step="100" value={quoteForm.minimumCharge} onChange={(e) => setQuoteForm({ ...quoteForm, minimumCharge: e.target.value })} />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ['Area', `${adminQuote.areaSqFt.toFixed(1)} sq.ft`],
                    ['Linear Length', `${adminQuote.linearMeters.toFixed(1)} m`],
                    ['Weight', `${adminQuote.totalWeight.toFixed(1)} kg`],
                    ['Final Quote', `Rs ${Math.round(adminQuote.total).toLocaleString('en-IN')}`]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-steel-900 p-4 text-white">
                      <p className="text-sm text-steel-300">{label}</p>
                      <p className="text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                  {[
                    ['Material', adminQuote.materialCost],
                    ['Fabrication', adminQuote.fabricationCost],
                    ['Finish', adminQuote.finishingCost],
                    ['Install', adminQuote.installationCost],
                    ['Extra', adminQuote.extraCost]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-steel-200 bg-white p-3">
                      <p className="text-steel-500">{label}</p>
                      <p className="font-bold text-steel-900">Rs {Math.round(value).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Quotation Reference</CardTitle>
                <p className="text-steel-600 mb-6">
                  Internal assumptions used by the public calculator. Update against current Hyderabad market rates before giving a final quote.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ['MS material', 'Rs 68/kg'],
                    ['SS 304 material', 'Rs 275/kg'],
                    ['MS fabrication', 'Rs 105/kg'],
                    ['SS fabrication', 'Rs 160/kg'],
                    ['MS finishing', 'Rs 45/sq.ft'],
                    ['SS finishing', 'Rs 20/sq.ft'],
                    ['Wastage', '7%'],
                    ['Minimum job', 'Rs 2,500']
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-steel-200 bg-white p-4">
                      <p className="text-sm text-steel-500">{label}</p>
                      <p className="text-xl font-bold text-steel-900">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Default Section Mapping</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {[
                    ['Window grills', '10mm round rod + angle frame'],
                    ['Security grills', '12mm round rod'],
                    ['Decorative grills', '20x20x2mm square pipe'],
                    ['Balcony railings', '20x20x2mm square pipe'],
                    ['Gate grills', '25x25x3mm angle'],
                    ['Staircase railings', '20mm round pipe']
                  ].map(([work, section]) => (
                    <div key={work} className="rounded-lg bg-steel-50 p-4">
                      <p className="font-semibold text-steel-900">{work}</p>
                      <p className="text-steel-600 mt-1">{section}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Final Quote Checklist</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-steel-700">
                  {[
                    'Confirm actual site width and height',
                    'Check number of openings or running feet',
                    'Confirm design pattern and bar spacing',
                    'Add posts, hinges, lock, wheels or fixtures where needed',
                    'Add transport and floor-height fitting difficulty',
                    'Confirm paint, powder coating, polish or SS grade',
                    'Apply daily steel market rate',
                    'Round final quote after customer scope confirmation'
                  ].map((item) => (
                    <div key={item} className="rounded-lg border border-steel-200 bg-white p-3">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
