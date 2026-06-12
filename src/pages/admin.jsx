import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { DEFAULT_PRICING, fetchPricing, savePricing } from '../utils/pricing.js';

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

// kg per linear meter for each profile. Square rods are the practical choice
// for window/security grills; round rod kept for old-style work.
const PROFILE_WEIGHTS = {
  sq_rod_8mm: 0.50,    // 8mm square rod (d² × 0.00785)
  sq_rod_10mm: 0.79,   // 10mm square rod
  sq_rod_12mm: 1.13,   // 12mm square rod
  rod_8mm: 0.39,       // 8mm round rod (d² × 0.006165)
  rod_10mm: 0.62,      // 10mm round rod
  rod_12mm: 0.89,      // 12mm round rod
  square: 1.15,        // 20x20x2mm square pipe
  round: 0.89,         // 20mm dia x 2mm round pipe
  angle: 1.12,         // 25x25x3mm angle
  square_heavy: 3.0    // 40x40x2.6mm square pipe (gates)
};

const PROFILE_LABELS = {
  sq_rod_8mm: '8mm Square Rod',
  sq_rod_10mm: '10mm Square Rod',
  sq_rod_12mm: '12mm Square Rod',
  rod_8mm: '8mm Round Rod',
  rod_10mm: '10mm Round Rod',
  rod_12mm: '12mm Round Rod',
  square: '20x20x2mm Square Pipe',
  round: '20mm Round Pipe',
  angle: '25x25x3mm Angle',
  square_heavy: '40x40x2.6mm Heavy Square Pipe'
};

const DEFAULT_PROFILE_BY_WORK = {
  window: 'sq_rod_10mm',
  security: 'sq_rod_12mm',
  decorative: 'square',
  balcony: 'square',
  gate: 'square_heavy',
  staircase: 'round'
};

const WORK_TYPE_LABELS = {
  window: 'Window Grills',
  security: 'Security Grills',
  decorative: 'Decorative Grills',
  balcony: 'Balcony Railings',
  gate: 'Gate Grills',
  staircase: 'Staircase Railings'
};

// Pricing object -> editable string draft for the settings form
const pricingToDraft = (p) => ({
  metalRates: { steel: String(p.metalRates.steel), stainless: String(p.metalRates.stainless) },
  fabricationRates: { steel: String(p.fabricationRates.steel), stainless: String(p.fabricationRates.stainless) },
  finishingRates: { steel: String(p.finishingRates.steel), stainless: String(p.finishingRates.stainless) },
  installationRates: Object.fromEntries(Object.entries(p.installationRates).map(([k, v]) => [k, String(v)])),
  grillComplexity: Object.fromEntries(Object.entries(p.grillComplexity).map(([k, v]) => [k, String(v)])),
  wastagePercent: String(p.wastagePercent),
  minimumCharge: String(p.minimumCharge)
});

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
    profile: 'sq_rod_10mm',
    spacing: '4',
    hSpacing: '24',
    wastage: '7',
    finishingRate: '45',
    installRate: '55',
    extraCost: '0'
  });

  // Centralized pricing — same rates the public website calculator uses.
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [pricingDraft, setPricingDraft] = useState(pricingToDraft(DEFAULT_PRICING));
  const [pricingMeta, setPricingMeta] = useState(null); // { updatedAt }
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingStatus, setPricingStatus] = useState(null); // { type, message }
  const [quoteCopied, setQuoteCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPricing()
      .then((serverPricing) => {
        if (cancelled) return;
        setPricing(serverPricing);
        setPricingDraft(pricingToDraft(serverPricing));
        if (serverPricing.updatedAt) setPricingMeta({ updatedAt: serverPricing.updatedAt });
      })
      .catch(() => {
        // Defaults stay in place; the settings form will still render
      });
    return () => { cancelled = true; };
  }, []);

  // Keep the per-quote rate fields in step with central pricing
  useEffect(() => {
    setQuoteForm((prev) => ({
      ...prev,
      finishingRate: String(pricing.finishingRates[prev.material] ?? prev.finishingRate),
      installRate: String(pricing.installationRates[prev.workType] ?? prev.installRate),
      wastage: String(pricing.wastagePercent ?? prev.wastage)
    }));
  }, [pricing]);

  const handleQuoteWorkTypeChange = (workType) => {
    setQuoteForm((prev) => ({
      ...prev,
      workType,
      profile: DEFAULT_PROFILE_BY_WORK[workType] || prev.profile,
      installRate: String(pricing.installationRates[workType] ?? prev.installRate)
    }));
  };

  const handleQuoteMaterialChange = (material) => {
    setQuoteForm((prev) => ({
      ...prev,
      material,
      finishingRate: String(pricing.finishingRates[material] ?? prev.finishingRate)
    }));
  };

  const setDraftRate = (group, key, value) => {
    setPricingStatus(null);
    setPricingDraft((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value }
    }));
  };

  const setDraftField = (key, value) => {
    setPricingStatus(null);
    setPricingDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePricing = async () => {
    setPricingSaving(true);
    setPricingStatus(null);
    try {
      const saved = await savePricing(pricingDraft, localStorage.getItem('admin_token'));
      setPricing(saved);
      setPricingDraft(pricingToDraft(saved));
      if (saved.updatedAt) setPricingMeta({ updatedAt: saved.updatedAt });
      setPricingStatus({ type: 'success', message: 'Saved. The website calculator now uses these rates.' });
    } catch (error) {
      setPricingStatus({ type: 'error', message: error.message || 'Failed to save pricing.' });
    } finally {
      setPricingSaving(false);
    }
  };

  const calculateAdminQuote = () => {
    const width = parseFloat(quoteForm.width) || 0;
    const height = parseFloat(quoteForm.height) || 0;
    const quantity = Math.max(1, parseInt(quoteForm.quantity, 10) || 1);
    const areaSqFt = width * height * quantity;
    const profileWeight = PROFILE_WEIGHTS[quoteForm.profile] || 1.15;
    const materialRate = pricing.metalRates[quoteForm.material] || 68;
    const fabricationRate = pricing.fabricationRates[quoteForm.material] || 105;
    const complexity = pricing.grillComplexity[quoteForm.workType] || 1;
    const wastagePercent = parseFloat(quoteForm.wastage) || 0;
    const finishingRate = parseFloat(quoteForm.finishingRate) || 0;
    const installRate = parseFloat(quoteForm.installRate) || 0;
    const extraCost = parseFloat(quoteForm.extraCost) || 0;
    // Minimum job charge comes from central Pricing Settings — not per quote
    const minimumCharge = Number(pricing.minimumCharge) || 0;

    let linearMeters = 0;
    let verticalBars = 0;
    let horizontalBars = 0;

    if (quoteForm.workType === 'window') {
      verticalBars = Math.max(2, Math.ceil((width * 12) / (parseFloat(quoteForm.spacing) || 4)));
      horizontalBars = Math.max(2, Math.ceil((height * 12) / (parseFloat(quoteForm.hSpacing) || 24)));
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
      verticalBars,
      horizontalBars,
      totalWeight,
      materialCost,
      fabricationCost,
      finishingCost,
      installationCost,
      extraCost,
      subtotal,
      total,
      minimumApplied: subtotal > 0 && subtotal < minimumCharge,
      ratePerSqFt: areaSqFt > 0 ? total / areaSqFt : 0,
      ratePerKg: totalWeight > 0 ? total / totalWeight : 0
    };
  };

  const adminQuote = calculateAdminQuote();

  // WhatsApp-ready quote message the owner can paste straight to a customer
  const buildAdminQuoteText = () => {
    const lines = [
      'eMetalWorks - Quotation',
      `Work: ${WORK_TYPE_LABELS[quoteForm.workType] || quoteForm.workType}`,
      `Material: ${quoteForm.material === 'steel' ? 'Mild Steel' : 'Stainless Steel 304'}`,
      `Section: ${PROFILE_LABELS[quoteForm.profile] || quoteForm.profile}`,
      `Size: ${quoteForm.width}ft x ${quoteForm.height}ft, Qty: ${quoteForm.quantity}`,
      `Approx. weight: ${Math.round(adminQuote.totalWeight)} kg`,
      `Total: Rs ${Math.round(adminQuote.total).toLocaleString('en-IN')} (≈ Rs ${Math.round(adminQuote.ratePerSqFt)}/sq.ft)`,
      'Includes material, fabrication, finishing and installation. Excludes GST.',
      'Final price after site measurement.'
    ];
    return lines.join('\n');
  };

  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(buildAdminQuoteText());
      setQuoteCopied(true);
      setTimeout(() => setQuoteCopied(false), 2000);
    } catch (error) {
      window.prompt('Copy the quote below:', buildAdminQuoteText());
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl mb-4">
              eM
            </div>
            <h1 className="text-2xl font-bold text-white">eMetalWorks</h1>
            <p className="text-sm text-slate-400 mt-1">Owner Console</p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Sign in to continue</h2>
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
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center rounded-xl px-3 py-2">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-slate-500 mt-6">Hyderabad · Window Grills · Balcony Railings · Gates</p>
        </div>
      </div>
    );
  }

  // FULL DASHBOARD INTERFACE
  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      onSelect: () => { setActiveView('dashboard'); loadDashboardData(); },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 11a1 1 0 011-1h4a1 1 0 011 1v8a1 1 0 01-1 1h-4a1 1 0 01-1-1v-8zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3z" />
        </svg>
      )
    },
    {
      key: 'contacts',
      label: 'Leads & Contacts',
      onSelect: () => { setActiveView('contacts'); loadContacts(); },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      key: 'analytics',
      label: 'Analytics',
      onSelect: () => { setActiveView('analytics'); loadDashboardData(); },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6m4 6V9m4 10V5M5 19h16" />
        </svg>
      )
    },
    {
      key: 'quotation',
      label: 'Quotes & Pricing',
      onSelect: () => setActiveView('quotation'),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
  ];
  const activeNavItem = navItems.find((item) => item.key === activeView) || navItems[0];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-40 bg-slate-900">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            eM
          </div>
          <div>
            <p className="text-white font-bold leading-tight">eMetalWorks</p>
            <p className="text-xs text-slate-400">Owner Console</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={item.onSelect}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeView === item.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Website
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 lg:pl-64 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="lg:hidden w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-extrabold shrink-0">
                eM
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{activeNavItem.label}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { loadDashboardData(); loadContacts(); }}
                title="Refresh all data"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="lg:hidden inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
          {/* Mobile nav pills */}
          <div className="lg:hidden px-4 pb-3 flex gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={item.onSelect}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeView === item.key
                    ? 'bg-primary-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto w-full">

        {loading && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Loading…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Dashboard View */}
        {activeView === 'dashboard' && !dashboardData && !loading && (
          <div className="text-center py-8">
            <div className="text-slate-500">No dashboard data available. Press Refresh to reload.</div>
          </div>
        )}
        {activeView === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  label: 'Total Visits',
                  value: dashboardData.totalVisits,
                  chip: 'from-sky-500 to-blue-600',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )
                },
                {
                  label: 'Visits Today',
                  value: dashboardData.hitsToday,
                  chip: 'from-emerald-500 to-green-600',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  )
                },
                {
                  label: 'Calculator Visits',
                  value: dashboardData.calculatorPageVisits,
                  chip: 'from-violet-500 to-purple-600',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  label: 'Quote Leads',
                  value: (dashboardData.calculatorLeads || []).length,
                  chip: 'from-amber-500 to-orange-600',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.chip} text-white flex items-center justify-center shadow-md mb-3`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">{stat.value ?? 0}</p>
                  <p className="text-sm font-medium text-slate-500 mt-1.5">{stat.label}</p>
                </div>
              ))}
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
            {/* ===== Quote Builder: form left, live summary right ===== */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
              <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Quote Builder</h3>
                    <p className="text-sm text-slate-500">Practical fabrication quote using your saved central rates</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Job Details</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-steel-700 mb-2">Work Type</label>
                        <select
                          value={quoteForm.workType}
                          onChange={(e) => handleQuoteWorkTypeChange(e.target.value)}
                          className="w-full px-3 py-3 border border-steel-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="window">Window Grills</option>
                          <option value="security">Security Grills</option>
                          <option value="decorative">Decorative Grills</option>
                          <option value="balcony">Balcony Railings</option>
                          <option value="gate">Gate Grills</option>
                          <option value="staircase">Staircase Railings</option>
                        </select>
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-steel-700 mb-2">Material</label>
                        <select
                          value={quoteForm.material}
                          onChange={(e) => handleQuoteMaterialChange(e.target.value)}
                          className="w-full px-3 py-3 border border-steel-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="steel">Mild Steel</option>
                          <option value="stainless">Stainless Steel 304</option>
                        </select>
                      </div>
                      <Input label="Width (ft)" type="number" step="0.1" value={quoteForm.width} onChange={(e) => setQuoteForm({ ...quoteForm, width: e.target.value })} />
                      <Input label="Height (ft)" type="number" step="0.1" value={quoteForm.height} onChange={(e) => setQuoteForm({ ...quoteForm, height: e.target.value })} />
                      <Input label="Quantity" type="number" min="1" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })} />
                      <div className="col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-steel-700 mb-2">Section / Profile</label>
                        <select
                          value={quoteForm.profile}
                          onChange={(e) => setQuoteForm({ ...quoteForm, profile: e.target.value })}
                          className="w-full px-3 py-3 border border-steel-300 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <optgroup label="Square Rods (standard for grills)">
                            <option value="sq_rod_8mm">8mm Square Rod ({PROFILE_WEIGHTS.sq_rod_8mm} kg/m)</option>
                            <option value="sq_rod_10mm">10mm Square Rod ({PROFILE_WEIGHTS.sq_rod_10mm} kg/m)</option>
                            <option value="sq_rod_12mm">12mm Square Rod ({PROFILE_WEIGHTS.sq_rod_12mm} kg/m)</option>
                          </optgroup>
                          <optgroup label="Round Rods (old-style)">
                            <option value="rod_8mm">8mm Round Rod ({PROFILE_WEIGHTS.rod_8mm} kg/m)</option>
                            <option value="rod_10mm">10mm Round Rod ({PROFILE_WEIGHTS.rod_10mm} kg/m)</option>
                            <option value="rod_12mm">12mm Round Rod ({PROFILE_WEIGHTS.rod_12mm} kg/m)</option>
                          </optgroup>
                          <optgroup label="Pipes / Sections">
                            <option value="square">20x20x2mm Square Pipe ({PROFILE_WEIGHTS.square} kg/m)</option>
                            <option value="round">20mm Round Pipe ({PROFILE_WEIGHTS.round} kg/m)</option>
                            <option value="angle">25x25x3mm Angle ({PROFILE_WEIGHTS.angle} kg/m)</option>
                            <option value="square_heavy">40x40x2.6mm Heavy Square Pipe ({PROFILE_WEIGHTS.square_heavy} kg/m)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Fabrication Settings</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {quoteForm.workType === 'window' && (
                        <>
                          <Input label="Vertical Bar Gap (in)" type="number" step="0.5" value={quoteForm.spacing} onChange={(e) => setQuoteForm({ ...quoteForm, spacing: e.target.value })} />
                          <Input label="Horizontal Bar Gap (in)" type="number" step="1" value={quoteForm.hSpacing} onChange={(e) => setQuoteForm({ ...quoteForm, hSpacing: e.target.value })} />
                        </>
                      )}
                      <Input label="Wastage (%)" type="number" step="1" value={quoteForm.wastage} onChange={(e) => setQuoteForm({ ...quoteForm, wastage: e.target.value })} />
                      <Input label="Finish Rate (₹/sq.ft)" type="number" step="5" value={quoteForm.finishingRate} onChange={(e) => setQuoteForm({ ...quoteForm, finishingRate: e.target.value })} />
                      <Input label="Install Rate (₹/sq.ft)" type="number" step="5" value={quoteForm.installRate} onChange={(e) => setQuoteForm({ ...quoteForm, installRate: e.target.value })} />
                      <Input label="Extra: hinges, lock, transport (₹)" type="number" step="100" value={quoteForm.extraCost} onChange={(e) => setQuoteForm({ ...quoteForm, extraCost: e.target.value })} />
                    </div>
                  </div>

                  {quoteForm.workType === 'window' && (
                    <div className="flex items-start gap-3 rounded-xl bg-primary-50 border border-primary-100 p-4">
                      <svg className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-primary-900">
                        Bar layout per unit: <strong>{adminQuote.verticalBars} vertical + {adminQuote.horizontalBars} horizontal</strong> {PROFILE_LABELS[quoteForm.profile] || quoteForm.profile} bars, plus angle frame on all four sides.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Live summary panel */}
              <div className="xl:col-span-2 xl:sticky xl:top-20 space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Final Quote</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-200">
                      {WORK_TYPE_LABELS[quoteForm.workType]} · Qty {quoteForm.quantity || 1}
                    </span>
                  </div>
                  <p className="text-4xl font-extrabold mt-2 tracking-tight">
                    ₹{Math.round(adminQuote.total).toLocaleString('en-IN')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300">
                      ≈ ₹{Math.round(adminQuote.ratePerSqFt).toLocaleString('en-IN')}/sq.ft
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-400/20 text-sky-300">
                      ≈ ₹{Math.round(adminQuote.ratePerKg).toLocaleString('en-IN')}/kg
                    </span>
                  </div>
                  {adminQuote.minimumApplied && (
                    <p className="mt-3 text-xs font-medium text-amber-300">
                      ⚠ Minimum job charge of ₹{Number(pricing.minimumCharge).toLocaleString('en-IN')} applied (from Pricing Settings)
                    </p>
                  )}
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    {[
                      ['Area', `${adminQuote.areaSqFt.toFixed(1)}`, 'sq.ft'],
                      ['Weight', `${adminQuote.totalWeight.toFixed(1)}`, 'kg'],
                      ['Length', `${adminQuote.linearMeters.toFixed(1)}`, 'm']
                    ].map(([label, value, unit]) => (
                      <div key={label} className="rounded-xl bg-white/10 p-3">
                        <p className="text-lg font-bold leading-none">{value}</p>
                        <p className="text-[11px] text-slate-300 mt-1">{unit} · {label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Cost Breakdown</h4>
                  {[
                    ['Material', adminQuote.materialCost, 'bg-emerald-500'],
                    ['Fabrication labour', adminQuote.fabricationCost, 'bg-blue-500'],
                    ['Finishing', adminQuote.finishingCost, 'bg-violet-500'],
                    ['Installation', adminQuote.installationCost, 'bg-amber-500'],
                    ['Extra / fixtures', adminQuote.extraCost, 'bg-rose-500']
                  ].map(([label, value, dot]) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="flex items-center gap-2.5 text-sm text-slate-600">
                        <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">₹{Math.round(value).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <button
                    onClick={handleCopyQuote}
                    className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-md transition-colors ${quoteCopied ? 'bg-emerald-600' : 'bg-[#25D366] hover:bg-[#1ebe5b]'}`}
                  >
                    {quoteCopied ? '✅ Copied!' : '📋 Copy Quote for WhatsApp'}
                  </button>
                  <p className="mt-3 text-xs text-slate-400">
                    Sanity check: Hyderabad MS grills usually land around ₹200–320/sq.ft installed. If the rate is far outside that, re-check spacing, profile or rates.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <CardTitle>Pricing Settings</CardTitle>
                  {pricingMeta?.updatedAt && (
                    <span className="text-xs text-steel-500">
                      Last updated: {new Date(pricingMeta.updatedAt).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-steel-600 mb-6 text-sm">
                  These rates drive the <strong>public website calculator</strong> and the quote tool below.
                  Update them when steel market rates or labour charges change, then press Save.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="rounded-lg border border-steel-200 p-4">
                    <h4 className="font-semibold text-steel-900 mb-3">Material Rate (₹/kg)</h4>
                    <div className="space-y-3">
                      <Input label="Mild Steel" type="number" step="1" value={pricingDraft.metalRates.steel} onChange={(e) => setDraftRate('metalRates', 'steel', e.target.value)} />
                      <Input label="Stainless Steel 304" type="number" step="5" value={pricingDraft.metalRates.stainless} onChange={(e) => setDraftRate('metalRates', 'stainless', e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-steel-200 p-4">
                    <h4 className="font-semibold text-steel-900 mb-3">Fabrication / Labour (₹/kg)</h4>
                    <div className="space-y-3">
                      <Input label="Mild Steel" type="number" step="5" value={pricingDraft.fabricationRates.steel} onChange={(e) => setDraftRate('fabricationRates', 'steel', e.target.value)} />
                      <Input label="Stainless Steel 304" type="number" step="5" value={pricingDraft.fabricationRates.stainless} onChange={(e) => setDraftRate('fabricationRates', 'stainless', e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-steel-200 p-4">
                    <h4 className="font-semibold text-steel-900 mb-3">Finishing (₹/sq.ft)</h4>
                    <div className="space-y-3">
                      <Input label="Mild Steel (paint)" type="number" step="5" value={pricingDraft.finishingRates.steel} onChange={(e) => setDraftRate('finishingRates', 'steel', e.target.value)} />
                      <Input label="Stainless Steel (polish)" type="number" step="5" value={pricingDraft.finishingRates.stainless} onChange={(e) => setDraftRate('finishingRates', 'stainless', e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-steel-200 p-4 lg:col-span-2">
                    <h4 className="font-semibold text-steel-900 mb-3">Installation (₹/sq.ft)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(pricingDraft.installationRates).map((workType) => (
                        <Input
                          key={workType}
                          label={WORK_TYPE_LABELS[workType] || workType}
                          type="number"
                          step="5"
                          value={pricingDraft.installationRates[workType]}
                          onChange={(e) => setDraftRate('installationRates', workType, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-steel-200 p-4">
                    <h4 className="font-semibold text-steel-900 mb-3">General</h4>
                    <div className="space-y-3">
                      <Input label="Wastage (%)" type="number" step="1" value={pricingDraft.wastagePercent} onChange={(e) => setDraftField('wastagePercent', e.target.value)} />
                      <Input label="Minimum Job Charge (₹)" type="number" step="100" value={pricingDraft.minimumCharge} onChange={(e) => setDraftField('minimumCharge', e.target.value)} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-steel-200 p-4 lg:col-span-3">
                    <h4 className="font-semibold text-steel-900 mb-3">Work Difficulty Multiplier (on fabrication ₹/kg)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.keys(pricingDraft.grillComplexity).map((workType) => (
                        <Input
                          key={workType}
                          label={WORK_TYPE_LABELS[workType] || workType}
                          type="number"
                          step="0.1"
                          value={pricingDraft.grillComplexity[workType]}
                          onChange={(e) => setDraftRate('grillComplexity', workType, e.target.value)}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-steel-500 mt-2">
                      Example: 1.3 means fabrication labour is charged 30% extra for that work type.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button onClick={handleSavePricing} disabled={pricingSaving}>
                    {pricingSaving ? 'Saving…' : 'Save Pricing'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setPricingDraft(pricingToDraft(pricing)); setPricingStatus(null); }}
                    disabled={pricingSaving}
                  >
                    Discard Changes
                  </Button>
                  {pricingStatus && (
                    <span className={`text-sm font-medium ${pricingStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {pricingStatus.type === 'success' ? '✅ ' : '⚠️ '}{pricingStatus.message}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <CardTitle className="mb-4">Live Rates Used by Website Calculator</CardTitle>
                <p className="text-steel-600 mb-6">
                  These are the saved central rates currently applied to every estimate on the public website. Edit them in Pricing Settings above.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ['MS material', `Rs ${pricing.metalRates.steel}/kg`],
                    ['SS 304 material', `Rs ${pricing.metalRates.stainless}/kg`],
                    ['MS fabrication', `Rs ${pricing.fabricationRates.steel}/kg`],
                    ['SS fabrication', `Rs ${pricing.fabricationRates.stainless}/kg`],
                    ['MS finishing', `Rs ${pricing.finishingRates.steel}/sq.ft`],
                    ['SS finishing', `Rs ${pricing.finishingRates.stainless}/sq.ft`],
                    ['Wastage', `${pricing.wastagePercent}%`],
                    ['Minimum job', `Rs ${Number(pricing.minimumCharge).toLocaleString('en-IN')}`]
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
                    ['Window grills', '10mm square rod + angle frame'],
                    ['Security grills', '12mm square rod'],
                    ['Decorative grills', '20x20x2mm square pipe'],
                    ['Balcony railings', '20x20x2mm square pipe'],
                    ['Gate grills', '40x40x2.6mm heavy square pipe'],
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
        </main>
      </div>
    </div>
  );
}

