import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5001';
  }

  // Render production fallback (override with VITE_API_URL)
  return 'https://emetalworks-backend.onrender.com';
};

const API_BASE_URL = resolveApiBaseUrl();
const authHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getContactId = (contact) => contact?._id || contact?.id;
const getContactDate = (contact) => contact?.submissionDate || contact?.createdAt || contact?.updatedAt;
const normalizeText = (value) => (value || '').toString().toLowerCase();

// --- Customer contact helpers (click-to-call / click-to-WhatsApp) ---

// Normalize a phone number to international digits (defaults to India +91)
// for use in wa.me / tel: links. Returns '' if no usable number.
const normalizePhone = (raw) => {
  let digits = (raw || '').replace(/\D/g, '');
  digits = digits.replace(/^0+/, ''); // drop domestic trunk prefix
  if (digits.length === 10) digits = `91${digits}`; // bare 10-digit local number
  return digits.length >= 11 ? digits : '';
};

// One-line summary of what the customer asked for — used in the WhatsApp message.
const requirementSummary = (contact) => {
  const parts = [];
  const want = contact?.subject || contact?.projectType;
  if (want) parts.push(want.toString().replace(/_/g, ' '));
  const cd = contact?.calculatorData;
  if (cd) {
    if (cd.dimensions?.width && cd.dimensions?.height) {
      parts.push(`${cd.dimensions.width}${cd.dimensions.widthUnit || 'ft'} x ${cd.dimensions.height}${cd.dimensions.heightUnit || 'ft'}`);
    }
    if (cd.grillType) parts.push(cd.grillType.toString().replace(/_/g, ' '));
    if (cd.metalType) parts.push(cd.metalType);
    if (cd.quantity) parts.push(`qty ${cd.quantity}`);
    if (cd.estimatedCost) parts.push(`approx Rs ${Math.round(cd.estimatedCost).toLocaleString('en-IN')}`);
  }
  return parts.join(', ');
};

// Prefilled WhatsApp message that greets the customer by name and references
// the exact requirement they submitted, so the owner can act immediately.
const buildWhatsAppText = (contact) => {
  const name = contact?.name ? ` ${contact.name}` : '';
  const summary = requirementSummary(contact);
  const reqLine = summary ? `\n\nYour requirement: ${summary}.` : '';
  return encodeURIComponent(
    `Hello${name}, this is eMetalWorks (Bhavya Fabrication Works) regarding your enquiry.` +
    reqLine +
    `\n\nWe'd be glad to help with your fabrication work. When is a good time to discuss the details and arrange a measurement?`
  );
};

const whatsAppHref = (contact) => {
  const phone = normalizePhone(contact?.phone);
  return phone ? `https://wa.me/${phone}?text=${buildWhatsAppText(contact)}` : null;
};

const telHref = (contact) => {
  const phone = normalizePhone(contact?.phone);
  return phone ? `tel:+${phone}` : null;
};

// --- Follow-up reminders ---
// Only open leads can be "due"; won/lost leads don't need chasing.
const ACTIVE_FOR_FOLLOWUP = ['new', 'contacted', 'quoted'];

// Returns 'overdue' | 'today' | 'upcoming' | null for a lead's follow-up date.
const followUpStatus = (contact) => {
  if (!contact?.followUpDate) return null;
  if (!ACTIVE_FOR_FOLLOWUP.includes(contact.status || 'new')) return null;
  const due = new Date(contact.followUpDate);
  if (isNaN(due.getTime())) return null;
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
  if (due < startToday) return 'overdue';
  if (due <= endToday) return 'today';
  return 'upcoming';
};

// Date-only 'YYYY-MM-DD' for <input type="date"> defaults.
const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

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
    totalVisits: 0,
    calculatorPageVisits: 0,
    uniqueVisitors: 0,
    calculatorUniqueVisitors: 0,
    recentCalculatorUsers: [],
    hitsToday: 0,
    dailyHits: [],
    calculatorLeads: [],
    totalContacts: 38,
    conversionRate: 0,
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
        status: 'closed'
      }
    ]
  });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedContact, setSelectedContact] = useState(null);
  const [detailsContact, setDetailsContact] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dueOnly, setDueOnly] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState('');
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
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      loadDashboardData(); // Load dashboard data on authentication
      loadContacts(); // Load contacts data on authentication
    } else {
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
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
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

  try {
    // Load dashboard stats
    const dashboardResponse = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
      headers: {
        ...authHeader(),
      }
    });

    // Load contact submissions
    const contactsResponse = await fetch(`${API_BASE_URL}/api/contact/submissions`, {
      headers: {
        ...authHeader(),
      }
    });

    const analyticsResponse = await fetch(`${API_BASE_URL}/api/analytics/summary`, {
      headers: {
        ...authHeader(),
      }
    });

    const dashboardData = await dashboardResponse.json();
    const contactsData = await contactsResponse.json();
    const analyticsData = await analyticsResponse.json();

    if (dashboardData.success && contactsData.success && analyticsData.success) {
      const submissions = contactsData.data.submissions || [];

      // Named calculator leads = people who submitted a quote from the calculator
      const calculatorLeads = submissions.filter((s) => s.source === 'calculator_quote');

      // Update dashboard data with real contact count
      const updatedDashboardData = {
        ...dashboardData.data,
        totalVisits: analyticsData.data.totalVisits || 0,
        calculatorPageVisits: analyticsData.data.calculatorPageVisits || 0,
        uniqueVisitors: analyticsData.data.uniqueVisitors || 0,
        calculatorUniqueVisitors: analyticsData.data.calculatorUniqueVisitors || 0,
        recentCalculatorUsers: analyticsData.data.recentCalculatorUsers || [],
        hitsToday: analyticsData.data.hitsToday || 0,
        dailyHits: analyticsData.data.dailyHits || [],
        calculatorHitsToday: analyticsData.data.calculatorHitsToday || 0,
        dailyCalculatorHits: analyticsData.data.dailyCalculatorHits || [],
        calculatorLeads,
        totalContacts: submissions.length,
        conversionRate: 0,
        recentContacts: submissions.slice(0, 5)
      };

      setDashboardData(updatedDashboardData);
      setContacts(submissions);
    } else {
      setError('Failed to load dashboard data');
    }
  } catch (error) {
    setError('Dashboard API not available - using demo mode');
    // Set demo data for development
    setDashboardData({
      totalVisits: 0,
      calculatorPageVisits: 0,
      uniqueVisitors: 0,
      calculatorUniqueVisitors: 0,
      recentCalculatorUsers: [],
      hitsToday: 0,
      dailyHits: [],
      calculatorHitsToday: 0,
      dailyCalculatorHits: [],
      calculatorLeads: [],
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/submissions`, {
        headers: {
          ...authHeader(),
        }
      });
      const data = await response.json();

      if (data.success && data.data.submissions) {
        setContacts(data.data.submissions);
      } else {
        setContacts([]);
      }
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/api/contact/submission/${contactId}/status`, {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadContacts(); // Reload contacts
      }
    } catch (error) {
      // ignore; user can retry
    }
  };

  // When the owner reaches out via WhatsApp/Call, advance a brand-new lead to
  // "contacted" automatically so the pipeline reflects reality without extra clicks.
  const markContacted = (contact) => {
    if ((contact?.status || 'new') === 'new') {
      updateContactStatus(getContactId(contact), 'contacted');
    }
  };

  const updateFollowUp = async (contactId, followUpDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/submission/${contactId}/followup`, {
        method: 'PUT',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ followUpDate: followUpDate || null })
      });

      if (response.ok) {
        // Keep the open detail modal in sync without a full refetch.
        setDetailsContact((prev) =>
          prev && getContactId(prev) === contactId
            ? { ...prev, followUpDate: followUpDate || null }
            : prev
        );
        loadContacts();
      }
    } catch (error) {
      // ignore; user can retry
    }
  };

  const addAdminNote = async (contactId) => {
    if (!adminNote.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/submission/${contactId}/note`, {
        method: 'POST',
        headers: {
          ...authHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: adminNote })
      });

      if (response.ok) {
        setAdminNote('');
        loadContacts(); // Reload contacts
      }
    } catch (error) {
      // ignore; user can retry
    }
  };

  const exportContacts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/export/contacts`, {
        headers: {
          ...authHeader(),
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
      // ignore; user can retry
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    const matchesSearch = !searchTerm ||
      normalizeText(contact.name).includes(normalizeText(searchTerm)) ||
      normalizeText(contact.email).includes(normalizeText(searchTerm)) ||
      normalizeText(contact.phone).includes(normalizeText(searchTerm)) ||
      normalizeText(contact.subject).includes(normalizeText(searchTerm));
    const due = followUpStatus(contact);
    const matchesDue = !dueOnly || due === 'overdue' || due === 'today';
    return matchesStatus && matchesSearch && matchesDue;
  });

  const dueCount = contacts.filter((c) => {
    const s = followUpStatus(c);
    return s === 'overdue' || s === 'today';
  }).length;

  if (!isAuthenticated) {
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
            variant={activeView === 'dashboard' ? 'primary' : 'outline'}
            onClick={() => {
              setActiveView('dashboard');
              loadDashboardData(); // Refresh data when switching to dashboard
            }}
            className="flex items-center gap-2"
          >
            📊 Dashboard
          </Button>
          <Button
            variant={activeView === 'contacts' ? 'primary' : 'outline'}
            onClick={() => {
              setActiveView('contacts');
              loadContacts(); // Refresh contacts when switching to contacts view
            }}
            className="flex items-center gap-2"
          >
            📋 Contacts
          </Button>
          <Button
            variant={activeView === 'analytics' ? 'primary' : 'outline'}
            onClick={() => {
              setActiveView('analytics');
              loadDashboardData(); // Refresh data when switching to analytics
            }}
            className="flex items-center gap-2"
          >
            📈 Analytics
          </Button>
          <Button
            variant={activeView === 'quotation' ? 'primary' : 'outline'}
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
        {activeView === 'dashboard' && !dashboardData && !loading && (
          <div className="text-center py-8">
            <div className="text-steel-600">No dashboard data available. Click "📊 Dashboard" to reload.</div>
          </div>
        )}
        {activeView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-sm font-medium text-steel-600">Calculator Page Visits</p>
                      <p className="text-3xl font-bold text-steel-900">{dashboardData.calculatorPageVisits}</p>
                    </div>
                    <div className="text-green-600">📧</div>
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
                      <div key={getContactId(contact)} className="flex items-center justify-between p-4 bg-steel-50 rounded-lg">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-steel-600">{contact.subject}</p>
                          <p className="text-xs text-steel-500">
                            {getContactDate(contact) ? new Date(getContactDate(contact)).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          contact.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          contact.status === 'quoted' ? 'bg-purple-100 text-purple-800' :
                          contact.status === 'converted' ? 'bg-green-100 text-green-800' :
                          contact.status === 'closed' ? 'bg-steel-200 text-steel-800' :
                          contact.status === 'spam' ? 'bg-red-100 text-red-800' :
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
                  <option value="quoted">Quoted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
                  <option value="spam">Spam</option>
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

            {/* Pipeline worklist — click a chip to filter; New = needs attention */}
            {(() => {
              const counts = (contacts || []).reduce((acc, c) => {
                const s = c.status || 'new';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {});
              const chips = [
                { key: 'new', label: 'New', cls: 'bg-blue-100 text-blue-800' },
                { key: 'contacted', label: 'Contacted', cls: 'bg-yellow-100 text-yellow-800' },
                { key: 'quoted', label: 'Quoted', cls: 'bg-purple-100 text-purple-800' },
                { key: 'converted', label: 'Converted', cls: 'bg-green-100 text-green-800' },
                { key: 'closed', label: 'Completed', cls: 'bg-steel-200 text-steel-800' }
              ];
              return (
                <div className="flex flex-wrap gap-2">
                  {chips.map((ch) => (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => { setDueOnly(false); setFilterStatus(filterStatus === ch.key ? 'all' : ch.key); }}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ${ch.cls} ${!dueOnly && filterStatus === ch.key ? 'ring-2 ring-steel-500 ring-offset-1' : ''}`}
                    >
                      {ch.label}: {counts[ch.key] || 0}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setFilterStatus('all'); setDueOnly((v) => !v); }}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${dueCount > 0 ? 'bg-orange-100 text-orange-800' : 'bg-steel-100 text-steel-600'} ${dueOnly ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
                    title="Leads with a follow-up due today or overdue"
                  >
                    ⏰ Follow-ups due: {dueCount}
                  </button>
                </div>
              );
            })()}

            {/* Contacts Table */}
            <Card>
              <CardContent className="p-0">
                {filteredContacts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-steel-100">
                        <tr>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700">Name</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700 whitespace-nowrap">Phone Number</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700 whitespace-nowrap">Project Type</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700">Comments</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700">Status</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700">Contact</th>
                          <th className="px-4 py-3 text-sm font-semibold text-steel-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => {
                          const contactId = getContactId(contact);
                          const noteCount = Array.isArray(contact.adminNotes) ? contact.adminNotes.length : 0;
                          const due = followUpStatus(contact);
                          return (
                            <tr key={contactId} className="border-t border-steel-200 hover:bg-steel-50">
                              <td className="px-4 py-3 align-top">
                                <button
                                  type="button"
                                  onClick={() => { setFollowUpDraft(toDateInput(contact.followUpDate)); setDetailsContact(contact); }}
                                  className="font-medium text-steel-900 hover:text-steel-700 hover:underline text-left"
                                >
                                  {contact.name}
                                </button>
                                {contact.email && (
                                  <div className="text-xs text-steel-500">{contact.email}</div>
                                )}
                                {due && (
                                  <div
                                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                                      due === 'overdue' ? 'bg-red-100 text-red-700'
                                        : due === 'today' ? 'bg-orange-100 text-orange-700'
                                        : 'bg-steel-100 text-steel-600'
                                    }`}
                                  >
                                    ⏰ {due === 'overdue' ? 'Overdue' : due === 'today' ? 'Due today' : `Follow up ${toDateInput(contact.followUpDate)}`}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-steel-700 whitespace-nowrap">
                                {contact.phone || '—'}
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-steel-700">
                                {contact.subject || contact.workType || contact.projectType || '—'}
                              </td>
                              <td className="px-4 py-3 align-top text-sm text-steel-600 max-w-xs">
                                <p className="line-clamp-3 whitespace-pre-wrap break-words">
                                  {contact.message || '—'}
                                </p>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <select
                                  value={contact.status || 'new'}
                                  onChange={(e) => updateContactStatus(contactId, e.target.value)}
                                  className="px-2 py-1 text-sm border border-steel-300 rounded-lg focus:ring-2 focus:ring-steel-500 focus:border-transparent bg-white"
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="quoted">Quoted</option>
                                  <option value="converted">Converted</option>
                                  <option value="closed">Completed</option>
                                  <option value="spam">Spam</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 align-top">
                                {normalizePhone(contact.phone) ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={whatsAppHref(contact)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => markContacted(contact)}
                                      title="Message on WhatsApp with their requirement prefilled"
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5b] whitespace-nowrap"
                                    >
                                      WhatsApp
                                    </a>
                                    <a
                                      href={telHref(contact)}
                                      onClick={() => markContacted(contact)}
                                      title="Call this customer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-steel-300 px-2.5 py-1.5 text-xs font-semibold text-steel-700 hover:bg-steel-50 whitespace-nowrap"
                                    >
                                      📞 Call
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-xs text-steel-400">No phone</span>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedContact(contact);
                                    setAdminNote('');
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  📝 Notes{noteCount ? ` (${noteCount})` : ''}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-steel-500">No contacts found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Remarks Modal */}
            {selectedContact && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setSelectedContact(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Contact remarks"
                  data-testid="remarks-modal"
                  className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-steel-900">
                          Remarks for {selectedContact.name}
                        </h3>
                        {selectedContact.email && (
                          <p className="text-sm text-steel-500">{selectedContact.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedContact(null)}
                        className="text-steel-500 hover:text-steel-700 text-2xl leading-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Array.isArray(selectedContact.adminNotes) && selectedContact.adminNotes.length > 0 ? (
                        selectedContact.adminNotes.map((note, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800 whitespace-pre-wrap">{note.note}</p>
                            <p className="text-xs text-yellow-600 mt-1">
                              {note.addedBy || 'admin'}
                              {note.addedAt ? ` · ${new Date(note.addedAt).toLocaleString()}` : ''}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-steel-500">No remarks yet.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-steel-700">Add a remark</label>
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={3}
                        placeholder="Enter remark..."
                        className="w-full px-3 py-2 border border-steel-300 rounded-lg focus:ring-2 focus:ring-steel-500 focus:border-transparent"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedContact(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            await addAdminNote(getContactId(selectedContact));
                            setSelectedContact(null);
                          }}
                          disabled={!adminNote.trim()}
                        >
                          Save Remark
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Modal */}
            {detailsContact && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => setDetailsContact(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Contact details"
                  data-testid="details-modal"
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-steel-900">{detailsContact.name}</h3>
                        {detailsContact.email && (
                          <p className="text-sm text-steel-500">{detailsContact.email}</p>
                        )}
                        {detailsContact.phone && (
                          <p className="text-sm text-steel-500">{detailsContact.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setDetailsContact(null)}
                        className="text-steel-500 hover:text-steel-700 text-2xl leading-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    {normalizePhone(detailsContact.phone) && (
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={whatsAppHref(detailsContact)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markContacted(detailsContact)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
                        >
                          Message on WhatsApp
                        </a>
                        <a
                          href={telHref(detailsContact)}
                          onClick={() => markContacted(detailsContact)}
                          className="inline-flex items-center gap-2 rounded-lg border border-steel-300 px-4 py-2 text-sm font-semibold text-steel-700 hover:bg-steel-50"
                        >
                          📞 Call {detailsContact.phone}
                        </a>
                      </div>
                    )}

                    {/* Follow-up reminder */}
                    <div className="rounded-lg border border-steel-200 bg-steel-50 p-3">
                      <p className="text-sm font-medium text-steel-700 mb-2">⏰ Follow-up reminder</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={followUpDraft}
                          onChange={(e) => setFollowUpDraft(e.target.value)}
                          className="px-3 py-2 border border-steel-300 rounded-lg text-sm bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateFollowUp(getContactId(detailsContact), followUpDraft)}
                          disabled={!followUpDraft}
                        >
                          Set reminder
                        </Button>
                        {detailsContact.followUpDate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setFollowUpDraft(''); updateFollowUp(getContactId(detailsContact), null); }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {detailsContact.followUpDate && (
                        <p className="mt-2 text-xs text-steel-600">
                          Currently set for {new Date(detailsContact.followUpDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {detailsContact.subject && (
                        <div>
                          <span className="font-medium text-steel-700">Subject: </span>
                          <span className="text-steel-600">{detailsContact.subject}</span>
                        </div>
                      )}
                      {detailsContact.projectType && (
                        <div>
                          <span className="font-medium text-steel-700">Project Type: </span>
                          <span className="text-steel-600">{detailsContact.projectType}</span>
                        </div>
                      )}
                      {detailsContact.projectBudget && (
                        <div>
                          <span className="font-medium text-steel-700">Budget: </span>
                          <span className="text-steel-600">{detailsContact.projectBudget}</span>
                        </div>
                      )}
                      {detailsContact.urgency && (
                        <div>
                          <span className="font-medium text-steel-700">Urgency: </span>
                          <span className="text-steel-600">{detailsContact.urgency}</span>
                        </div>
                      )}
                      {detailsContact.source && (
                        <div>
                          <span className="font-medium text-steel-700">Source: </span>
                          <span className="text-steel-600">{detailsContact.source}</span>
                        </div>
                      )}
                      {getContactDate(detailsContact) && (
                        <div>
                          <span className="font-medium text-steel-700">Submitted: </span>
                          <span className="text-steel-600">
                            {new Date(getContactDate(detailsContact)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {detailsContact.message && (
                      <div>
                        <p className="text-sm font-medium text-steel-700 mb-1">Message</p>
                        <p className="text-sm text-steel-600 whitespace-pre-wrap break-words">
                          {detailsContact.message}
                        </p>
                      </div>
                    )}

                    {detailsContact.calculatorData && (
                      <div className="p-4 bg-steel-50 rounded-lg">
                        <h4 className="text-sm font-medium text-steel-700 mb-2">Calculator Data</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          {detailsContact.calculatorData.dimensions && (
                            <div>
                              <span className="font-medium">Dimensions: </span>
                              {detailsContact.calculatorData.dimensions.width} × {detailsContact.calculatorData.dimensions.height}
                              {detailsContact.calculatorData.dimensions.widthUnit || 'ft'} × {detailsContact.calculatorData.dimensions.heightUnit || 'ft'}
                            </div>
                          )}
                          {detailsContact.calculatorData.grillType && (
                            <div>
                              <span className="font-medium">Grill Type: </span>
                              {detailsContact.calculatorData.grillType}
                            </div>
                          )}
                          {detailsContact.calculatorData.metalType && (
                            <div>
                              <span className="font-medium">Metal Type: </span>
                              {detailsContact.calculatorData.metalType}
                            </div>
                          )}
                          {detailsContact.calculatorData.profileType && (
                            <div>
                              <span className="font-medium">Profile: </span>
                              {detailsContact.calculatorData.profileType}
                            </div>
                          )}
                          {detailsContact.calculatorData.quantity && (
                            <div>
                              <span className="font-medium">Quantity: </span>
                              {detailsContact.calculatorData.quantity}
                            </div>
                          )}
                          {detailsContact.calculatorData.estimatedWeight && (
                            <div>
                              <span className="font-medium">Weight: </span>
                              {Math.round(detailsContact.calculatorData.estimatedWeight)} kg
                            </div>
                          )}
                          {detailsContact.calculatorData.estimatedCost && (
                            <div>
                              <span className="font-medium">Cost: </span>
                              ₹{Math.round(detailsContact.calculatorData.estimatedCost)}
                            </div>
                          )}
                          {detailsContact.calculatorData.calculatorType && (
                            <div>
                              <span className="font-medium">Calculator: </span>
                              {detailsContact.calculatorData.calculatorType}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setDetailsContact(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && dashboardData && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Analytics Overview</CardTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-steel-200 bg-steel-50 p-4">
                    <p className="text-sm text-steel-600">Total Website Visits</p>
                    <p className="mt-2 text-3xl font-bold text-steel-900">{dashboardData.totalVisits}</p>
                  </div>
                  <div className="rounded-lg border border-steel-200 bg-steel-50 p-4">
                    <p className="text-sm text-steel-600">Unique Visitors</p>
                    <p className="mt-2 text-3xl font-bold text-steel-900">{dashboardData.uniqueVisitors}</p>
                  </div>
                  <div className="rounded-lg border border-steel-200 bg-steel-50 p-4">
                    <p className="text-sm text-steel-600">Calculator Page Visits</p>
                    <p className="mt-2 text-3xl font-bold text-steel-900">{dashboardData.calculatorPageVisits}</p>
                  </div>
                  <div className="rounded-lg border border-steel-200 bg-steel-50 p-4">
                    <p className="text-sm text-steel-600">Calculator Unique Visitors</p>
                    <p className="mt-2 text-3xl font-bold text-steel-900">{dashboardData.calculatorUniqueVisitors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily hits: raw page loads per day (counts repeat visits, unlike unique visitors) */}
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Daily Hits</CardTitle>
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">Website Hits Today</p>
                    <p className="mt-2 text-4xl font-bold text-blue-700">{dashboardData.hitsToday}</p>
                    <p className="mt-1 text-xs text-blue-600">Total page loads today (IST). Repeat visits are counted.</p>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="text-sm text-orange-700">Calculator Opens Today</p>
                    <p className="mt-2 text-4xl font-bold text-orange-700">{dashboardData.calculatorHitsToday}</p>
                    <p className="mt-1 text-xs text-orange-600">Total calculator opens today (IST). Repeat opens are counted.</p>
                  </div>
                </div>
                {(() => {
                  // Merge the two daily series (dates may differ) into one table.
                  const byDate = {};
                  (dashboardData.dailyHits || []).forEach((d) => {
                    byDate[d.date] = byDate[d.date] || { date: d.date, hits: 0, calc: 0 };
                    byDate[d.date].hits = d.count;
                  });
                  (dashboardData.dailyCalculatorHits || []).forEach((d) => {
                    byDate[d.date] = byDate[d.date] || { date: d.date, hits: 0, calc: 0 };
                    byDate[d.date].calc = d.count;
                  });
                  const rows = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

                  return rows.length === 0 ? (
                    <p className="text-sm text-steel-600">No hits recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-steel-600 border-b border-steel-200">
                            <th className="py-2 pr-4 font-medium">Date</th>
                            <th className="py-2 pr-4 font-medium">Website Hits</th>
                            <th className="py-2 pr-4 font-medium">Calculator Opens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.date} className="border-b border-steel-100">
                              <td className="py-2 pr-4 text-steel-900">
                                {new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </td>
                              <td className="py-2 pr-4 text-steel-700 font-semibold">{r.hits}</td>
                              <td className="py-2 pr-4 text-steel-700 font-semibold">{r.calc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Named calculator leads: people who submitted a quote from the calculator */}
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">
                  Calculator Leads ({(dashboardData.calculatorLeads || []).length})
                </CardTitle>
                {(dashboardData.calculatorLeads || []).length === 0 ? (
                  <p className="text-sm text-steel-600">No calculator quote submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-steel-600 border-b border-steel-200">
                          <th className="py-2 pr-4 font-medium">Name</th>
                          <th className="py-2 pr-4 font-medium">Phone</th>
                          <th className="py-2 pr-4 font-medium">Email</th>
                          <th className="py-2 pr-4 font-medium">Est. Cost</th>
                          <th className="py-2 pr-4 font-medium">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardData.calculatorLeads || []).map((lead) => (
                          <tr key={lead._id || lead.id} className="border-b border-steel-100">
                            <td className="py-2 pr-4 text-steel-900">{lead.name}</td>
                            <td className="py-2 pr-4 text-steel-700">{lead.phone}</td>
                            <td className="py-2 pr-4 text-steel-700">{lead.email}</td>
                            <td className="py-2 pr-4 text-steel-700">
                              {lead.calculatorData?.estimatedCost
                                ? `₹${Number(lead.calculatorData.estimatedCost).toLocaleString('en-IN')}`
                                : '—'}
                            </td>
                            <td className="py-2 pr-4 text-steel-700">
                              {lead.submissionDate
                                ? new Date(lead.submissionDate).toLocaleDateString('en-IN')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anonymous reach: recent calculator sessions (no quote submitted) */}
            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Recent Calculator Sessions</CardTitle>
                {(dashboardData.recentCalculatorUsers || []).length === 0 ? (
                  <p className="text-sm text-steel-600">No calculator usage recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-steel-600 border-b border-steel-200">
                          <th className="py-2 pr-4 font-medium">Visitor</th>
                          <th className="py-2 pr-4 font-medium">IP Address</th>
                          <th className="py-2 pr-4 font-medium">Device</th>
                          <th className="py-2 pr-4 font-medium">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dashboardData.recentCalculatorUsers || []).map((u) => (
                          <tr key={u.visitorId + u.firstSeenAt} className="border-b border-steel-100">
                            <td className="py-2 pr-4 text-steel-900 font-mono text-xs">
                              {(u.visitorId || '').slice(0, 20)}
                            </td>
                            <td className="py-2 pr-4 text-steel-700">{u.ipAddress || 'unknown'}</td>
                            <td className="py-2 pr-4 text-steel-700 max-w-xs truncate" title={u.userAgent}>
                              {u.userAgent || '—'}
                            </td>
                            <td className="py-2 pr-4 text-steel-700">
                              {u.firstSeenAt ? new Date(u.firstSeenAt).toLocaleString('en-IN') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

