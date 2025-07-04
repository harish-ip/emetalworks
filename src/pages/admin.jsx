import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

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

  // Check if already authenticated
  useEffect(() => {
    console.log('useEffect: Checking authentication...');
    const token = localStorage.getItem('admin_token');
    console.log('useEffect: Token found:', !!token);
    if (token) {
      console.log('useEffect: Setting authenticated to true');
      setIsAuthenticated(true);
      // loadDashboardData(); // Commented out - using dummy data
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
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
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
        // loadDashboardData(); // Commented out - using dummy data
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
      const dashboardResponse = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Load contact submissions
      const contactsResponse = await fetch(`${API_BASE_URL}/contact/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
    console.log('Loading contacts - using dummy data for now');
    // Using dummy data instead of API call for testing
    setTimeout(() => {
      console.log('Contacts loaded successfully');
      setLoading(false);
    }, 500);

    /* Commented out API call for testing
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/contact/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setContacts(data.data.submissions);
      } else {
        setError('Failed to load contacts');
      }
    } catch (error) {
      console.warn('Contacts API not available:', error);
      setError('Contacts API not available - using demo mode');
      // Set demo data for development
      setContacts([]);
    } finally {
      setLoading(false);
    }
    */
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
      const response = await fetch(`${API_BASE_URL}/contact/submission/${contactId}/status`, {
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
      const response = await fetch(`${API_BASE_URL}/contact/submission/${contactId}/note`, {
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
      const response = await fetch(`${API_BASE_URL}/admin/export/contacts`, {
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('dashboard');
                loadDashboardData();
              }}
            >
              📊 Dashboard
            </Button>
            <Button
              variant={activeView === 'contacts' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('contacts');
                loadContacts();
              }}
            >
              📧 Contacts
            </Button>
            <Button
              variant={activeView === 'analytics' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('analytics');
                loadDashboardData();
              }}
            >
              📈 Analytics
            </Button>
            <Button variant="outline" onClick={exportContacts}>
              📥 Export
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              🚪 Logout
            </Button>
          </div>
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
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Contact Management</CardTitle>
                <div className="space-y-4">
                  {contacts && contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <div key={contact.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{contact.name}</h3>
                            <p className="text-sm text-steel-600">{contact.email} | {contact.phone}</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                            contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                            contact.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                            contact.status === 'quoted' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contact.status.replace('_', ' ')}
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-1">{contact.subject}</p>
                        <p className="text-sm text-steel-600 mb-2">{contact.message}</p>
                        <p className="text-xs text-steel-500">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </p>
                        {contact.adminNote && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                            <strong>Admin Note:</strong> {contact.adminNote}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-steel-600">No contacts available</p>
                  )}
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );

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
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('dashboard');
                loadDashboardData();
              }}
            >
              📊 Dashboard
            </Button>
            <Button
              variant={activeView === 'contacts' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('contacts');
                loadContacts();
              }}
            >
              📧 Contacts
            </Button>
            <Button
              variant={activeView === 'analytics' ? 'default' : 'outline'}
              onClick={() => {
                setActiveView('analytics');
                loadDashboardData();
              }}
            >
              📈 Analytics
            </Button>
            <Button variant="outline" onClick={exportContacts}>
              📥 Export
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              🚪 Logout
            </Button>
          </div>
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
        {activeView === 'dashboard' && (
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
            {/* Filters and Search */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === 'new' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('new')}
                    >
                      New
                    </Button>
                    <Button
                      variant={filterStatus === 'contacted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('contacted')}
                    >
                      Contacted
                    </Button>
                    <Button
                      variant={filterStatus === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('completed')}
                    >
                      Completed
                    </Button>
                  </div>
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contacts List */}
            <div className="grid gap-4">
              {filteredContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{contact.name}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                            contact.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {contact.status}
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-steel-600 mb-3">
                          <p>📧 {contact.email}</p>
                          <p>📱 {contact.phone}</p>
                          <p>📅 {new Date(contact.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="mb-3">
                          <p className="font-medium text-steel-900 mb-1">{contact.subject}</p>
                          <p className="text-steel-700">{contact.message}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedContact(contact)}
                        >
                          View Details
                        </Button>
                        <select
                          value={contact.status}
                          onChange={(e) => updateContactStatus(contact.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-steel-600">No contacts found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            {/* Conversion Funnel */}
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Conversion Funnel</CardTitle>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="font-medium">Website Visits</span>
                    <span className="text-2xl font-bold text-blue-600">{dashboardData.totalVisits}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="font-medium">Contact Submissions</span>
                    <span className="text-2xl font-bold text-green-600">{dashboardData.totalContacts}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <span className="font-medium">Conversion Rate</span>
                    <span className="text-2xl font-bold text-purple-600">{dashboardData.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <CardTitle className="mb-4">Response Metrics</CardTitle>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Response Time</span>
                      <span className="font-medium">2.5 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>First Contact Resolution</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Satisfaction</span>
                      <span className="font-medium">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <CardTitle className="mb-4">Business Metrics</CardTitle>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Project Completion Rate</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repeat Customers</span>
                      <span className="font-medium">32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Growth</span>
                      <span className="font-medium text-green-600">+18%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Contact Detail Modal */}
        {selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <CardTitle>Contact Details: {selectedContact.name}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContact(null)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-steel-600">Name</label>
                      <div className="text-steel-900">{selectedContact.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-steel-600">Email</label>
                      <div className="text-steel-900">{selectedContact.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-steel-600">Phone</label>
                      <div className="text-steel-900">{selectedContact.phone}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-steel-600">Status</label>
                      <div className="text-steel-900">{selectedContact.status}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-steel-600">Subject</label>
                    <div className="text-steel-900">{selectedContact.subject}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-steel-600">Message</label>
                    <div className="text-steel-900 bg-steel-50 p-3 rounded">{selectedContact.message}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}