import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  initializeTracking,
  trackTabSwitch,
  trackCalculatorUsage,
  trackContactFormInteraction,
  submitContactForm,
  trackInteraction,
  getSessionInfo
} from '../utils/analytics';
import { DEFAULT_PRICING, fetchPricing } from '../utils/pricing';
import { calculateBalconyGrill, BALCONY_CONFIG } from '../utils/balconyCalc.js';

// Service Icons
const ServiceIcons = {
  railing: (
    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  grill: (
    <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  gate: (
    <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  shed: (
    <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l8-8-8-8" />
    </svg>
  ),
  stair: (
    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  custom: (
    <svg className="w-8 h-8 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// Grill Type Icons for Calculator
const GrillTypeIcons = {
  window: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  security: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  decorative: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  balcony: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  gate: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  staircase: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

// ===== PRICING CONFIGURATION SECTION =====
// Rates are managed centrally from the Admin → Quotation → Pricing Settings
// page (stored on the server). DEFAULT_PRICING in src/utils/pricing.js is the
// fallback used until the server responds or when it is unreachable.

	// Map calculator grill type to contact form project type
	const GRILL_TYPE_TO_PROJECT_TYPE = {
	  window: 'window_grill',
	  security: 'security_grill',
	  decorative: 'decorative_grill',
	  balcony: 'balcony_grill',
	  gate: 'gate',
	  staircase: 'staircase'
	};

const WHATSAPP_PHONE = '919985393064';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi eMetalWorks, I need help with a steel fabrication estimate.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${WHATSAPP_MESSAGE}`;

const WhatsAppIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
    <path d="M16.04 3.2C9 3.2 3.28 8.86 3.28 15.82c0 2.23.6 4.4 1.72 6.31L3.17 28.8l6.88-1.79a12.92 12.92 0 0 0 5.99 1.51c7.04 0 12.76-5.66 12.76-12.62S23.08 3.2 16.04 3.2Zm0 23.19c-1.9 0-3.75-.5-5.37-1.45l-.39-.23-4.08 1.06 1.09-3.92-.26-.4a10.28 10.28 0 0 1-1.6-5.54c0-5.78 4.76-10.49 10.61-10.49s10.61 4.7 10.61 10.49-4.76 10.48-10.61 10.48Zm5.82-7.85c-.32-.16-1.9-.93-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.49-2.58-1.57-.95-.84-1.6-1.89-1.79-2.21-.19-.32-.02-.49.14-.65.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.72-.98-2.36-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.27 3.43 5.5 4.8.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z" />
  </svg>
);

export default function HomePage() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [activeTab, setActiveTab] = useState('home');

  // Centralized pricing: owner-managed rates from the server, with local
  // defaults so the calculator works even if the backend is asleep.
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  useEffect(() => {
    let cancelled = false;
    fetchPricing()
      .then((serverPricing) => {
        if (!cancelled) setPricing(serverPricing);
      })
      .catch(() => {
        // Keep DEFAULT_PRICING — never block the calculator on the backend
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize tracking when component mounts
  useEffect(() => {
    initializeTracking();
  }, []);

  // Helper function to handle tab switching with tracking
  const handleTabSwitch = (newTab) => {
    const oldTab = activeTab;
    setActiveTab(newTab);
    trackTabSwitch(oldTab, newTab);
  };

  // Calculator options
  const [grillType, setGrillType] = useState('window');
  const [metalType, setMetalType] = useState('steel');
  const [profileType, setProfileType] = useState('square'); // square, round, angle

  // Unit conversion options (must be declared before useEffect)
  const [widthUnit, setWidthUnit] = useState('ft');
  const [heightUnit, setHeightUnit] = useState('ft');
  const defaultProfileByGrillType = {
    window: 'sq_rod_10mm',
    security: 'sq_rod_12mm',
    decorative: 'square',
    balcony: 'square',
    gate: 'square_heavy',
    staircase: 'round'
  };

  // Rod count state for window grills
  const [verticalRods, setVerticalRods] = useState(3);
  const [horizontalRods, setHorizontalRods] = useState(5);

  // Function to suggest default rod counts based on window size
  const getDefaultRodCounts = (widthFt, heightFt) => {
    // Typical Hyderabad window grill: vertical rods at ~4 inch (100mm) gap,
    // horizontal members roughly every 24 inches (top/middle/bottom pattern)
    const verticalSpacing = 4; // inches
    const horizontalSpacing = 24; // inches

    const suggestedVertical = Math.max(2, Math.ceil((widthFt * 12) / verticalSpacing));
    const suggestedHorizontal = Math.max(2, Math.ceil((heightFt * 12) / horizontalSpacing));

    return {
      vertical: suggestedVertical,
      horizontal: suggestedHorizontal
    };
  };

  // Update rod counts when dimensions change
  useEffect(() => {
    if (grillType === 'window' && width && height) {
      const widthInFt = convertToFeet(width, widthUnit);
      const heightInFt = convertToFeet(height, heightUnit);
      const defaults = getDefaultRodCounts(widthInFt, heightInFt);
      setVerticalRods(defaults.vertical);
      setHorizontalRods(defaults.horizontal);
    }
  }, [width, height, widthUnit, heightUnit, grillType]);

  useEffect(() => {
    setProfileType(defaultProfileByGrillType[grillType] || 'square');
    setShowAdvancedCalculator(false);
  }, [grillType]);

  // Advanced calculator state
  const [showAdvancedCalculator, setShowAdvancedCalculator] = useState(false);
  const [balconyCheck, setBalconyCheck] = useState('4');
  const [balconyType, setBalconyType] = useState('box');
  const [showBalconyWorking, setShowBalconyWorking] = useState(false);
  const [customLinearFactor, setCustomLinearFactor] = useState('');
  const [customProfileWeight, setCustomProfileWeight] = useState('');
  const [customProfileSize, setCustomProfileSize] = useState('');

  // Practical fabrication formula inputs
  const [designType, setDesignType] = useState('simple'); // simple, medium, heavy
  const [barSpacing, setBarSpacing] = useState('4'); // in inches
  const [wastagePercent, setWastagePercent] = useState('7'); // 5-10% default
  const [laborRate, setLaborRate] = useState('70'); // Rs per sq.ft for installation/finishing allowance
  const [customDesignFactor, setCustomDesignFactor] = useState(''); // ₹ per foot for fancy work



  // Function to navigate to calculator with pre-selected grill type
  const goToCalculator = (serviceType = null) => {
    if (typeof serviceType === 'string' && serviceType) {
      // Map service types to grill types
      const serviceToGrillMap = {
        'Balcony Grills': 'balcony',
        'Window Grills': 'window',
        'Steel Gates': 'gate',
        'Staircase Railings': 'staircase',
        'Custom Fabrication': 'decorative',
        'Sheds': 'window' // Default to window for sheds
      };

      const mappedGrillType = serviceToGrillMap[serviceType];
      if (mappedGrillType) {
        setGrillType(mappedGrillType);
        // Show notification
        setQuoteNotification(`${serviceType} selected in calculator!`);
        setTimeout(() => setQuoteNotification(null), 3000);
      }
    }
    handleTabSwitch('calculator');
    // Smooth-scroll to the calculator anchor once the panel mounts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById('calculator');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

	  // Contact form state
	  const [contactForm, setContactForm] = useState({
	    name: '',
	    email: '',
	    phone: '',
	    subject: '',
	    message: '',
	    projectType: ''
	  });

	  const [isSubmitting, setIsSubmitting] = useState(false);
	  const [submitStatus, setSubmitStatus] = useState(null);
	  const [formErrors, setFormErrors] = useState([]);
	  const [includeCalculatorData, setIncludeCalculatorData] = useState(false);
	  const [hasManualProjectTypeChange, setHasManualProjectTypeChange] = useState(false);

  // WhatsApp lead capture modal state
  const [waModal, setWaModal] = useState(false);
  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waSubmitting, setWaSubmitting] = useState(false);
  const [waPendingUrl, setWaPendingUrl] = useState('');

  // Quote notification state
  const [quoteNotification, setQuoteNotification] = useState(null); // 'success', 'error', or null

  // Linear meters of profile needed per square meter of grill area (based on design complexity)
  const linearMetersPerSqMeter = {
    window: 6,          // 6 m/m² - Simple window grills with basic grid pattern
    security: 10,       // 10 m/m² - Security grills with closer spacing and reinforcement
    decorative: 8,      // 8 m/m² - Decorative grills with artistic patterns
    balcony: 7,         // 7 m/m² - Balcony grills (used only by non-balcony path; balcony uses shop formula)
    gate: 12,           // 12 m/m² - Gates with frame, reinforcement, and locking mechanisms
    staircase: 9        // 9 m/m² - Staircase railings with vertical supports and handrails
  };

  // Design type configurations for practical fabrication
  const designTypeConfig = {
    simple: {
      name: 'Simple Design',
      barSpacingDefault: 4, // inches
      complexityFactor: 1.0,
      description: 'Basic vertical bars, minimal design'
    },
    medium: {
      name: 'Medium Design',
      barSpacingDefault: 3,
      complexityFactor: 1.3,
      description: 'Some horizontal bars, moderate complexity'
    },
    heavy: {
      name: 'Heavy Design',
      barSpacingDefault: 2.5,
      complexityFactor: 1.6,
      description: 'Complex patterns, decorative elements'
    }
  };

  // Standard bar weights (kg per foot) for common sizes used in fabrication
  const barWeightPerFoot = {
    '8mm': { round: 0.12, square: 0.15 },
    '10mm': { round: 0.19, square: 0.24 },
    '12mm': { round: 0.27, square: 0.34 },
    '16mm': { round: 0.48, square: 0.61 },
    '20mm': { round: 0.75, square: 0.96 }
  };

  // Weight per meter for different profile types and metals (kg/m)
  // Based on standard sizes and rod thickness options
  const weightPerMeter = {
    square: {
      steel: 1.15,        // 20x20x2mm square pipe in mild steel
      stainless: 1.15,    // 20x20x2mm square pipe in stainless steel (same dimensions)
      aluminum: 0.40,     // 20x20x2mm square pipe in aluminum
      iron: 1.08          // 20x20x2mm square pipe in cast iron
    },
    round: {
      steel: 0.89,        // 20mm dia x 2mm wall round pipe in mild steel
      stainless: 0.89,    // 20mm dia x 2mm wall round pipe in stainless steel
      aluminum: 0.31,     // 20mm dia x 2mm wall round pipe in aluminum
      iron: 0.84          // 20mm dia x 2mm wall round pipe in cast iron
    },
    angle: {
      steel: 1.12,        // 25x25x3mm angle iron in mild steel
      stainless: 1.12,    // 25x25x3mm angle iron in stainless steel
      aluminum: 0.39,     // 25x25x3mm angle iron in aluminum
      iron: 1.06          // 25x25x3mm angle iron in cast iron
    },
    square_heavy: {
      steel: 3.0,         // 40x40x2.6mm square pipe for gate frames/infill in mild steel
      stainless: 3.0,     // 40x40x2.6mm square pipe in stainless steel
      aluminum: 1.05,     // 40x40x2.6mm square pipe in aluminum
      iron: 2.85          // 40x40x2.6mm square pipe in cast iron
    },
    // Rod thickness options for window grills (using round bar formula: d² × 0.006165 kg/m)
    rod_8mm: {
      steel: 0.39,        // 8mm dia round rod - (8² × 0.006165) = 0.39 kg/m
      stainless: 0.39,    // 8mm dia round rod in stainless steel
      aluminum: 0.14,     // 8mm dia round rod in aluminum (density factor ~0.35)
      iron: 0.37          // 8mm dia round rod in cast iron
    },
    rod_10mm: {
      steel: 0.62,        // 10mm dia round rod - (10² × 0.006165) = 0.62 kg/m
      stainless: 0.62,    // 10mm dia round rod in stainless steel
      aluminum: 0.22,     // 10mm dia round rod in aluminum
      iron: 0.58          // 10mm dia round rod in cast iron
    },
    rod_12mm: {
      steel: 0.89,        // 12mm dia round rod - (12² × 0.006165) = 0.89 kg/m
      stainless: 0.89,    // 12mm dia round rod in stainless steel
      aluminum: 0.31,     // 12mm dia round rod in aluminum
      iron: 0.84          // 12mm dia round rod in cast iron
    },
    // Square rod options - the practical choice for Hyderabad window/security
    // grills (square bar formula: d² × 0.00785 kg/m)
    sq_rod_8mm: {
      steel: 0.50,        // 8mm square rod - (8² × 0.00785) = 0.50 kg/m
      stainless: 0.50,
      aluminum: 0.18,
      iron: 0.48
    },
    sq_rod_10mm: {
      steel: 0.79,        // 10mm square rod - (10² × 0.00785) = 0.79 kg/m
      stainless: 0.79,
      aluminum: 0.27,
      iron: 0.75
    },
    sq_rod_12mm: {
      steel: 1.13,        // 12mm square rod - (12² × 0.00785) = 1.13 kg/m
      stainless: 1.13,
      aluminum: 0.40,
      iron: 1.07
    }
  };

  // ===== UNIT CONVERSION FUNCTIONS =====
  const convertToCm = (value, unit) => {
    const conversions = {
      'cm': 1,           // Centimeters (base unit)
      'mm': 0.1,         // Millimeters to cm
      'inch': 2.54,      // Inches to cm
      'ft': 30.48,       // Feet to cm
      'm': 100           // Meters to cm
    };
    return value * conversions[unit];
  };

  const convertToFeet = (value, unit) => {
    const conversions = {
      'cm': 0.0328084,   // Centimeters to feet
      'mm': 0.00328084,  // Millimeters to feet
      'inch': 0.0833333, // Inches to feet
      'ft': 1,           // Feet (base unit)
      'm': 3.28084       // Meters to feet
    };
    return value * conversions[unit];
  };

  const numericQuantity = Math.max(1, parseInt(quantity, 10) || 1);

  // Convert all dimensions to cm for calculation
  const widthInCm = convertToCm(width, widthUnit);
  const heightInCm = convertToCm(height, heightUnit);

  // Calculate final rate per kg using centralized pricing config
  const getMetalRate = () => {
    return pricing.metalRates[metalType];
  };

  const getFabricationRate = () => {
    return pricing.fabricationRates[metalType] * pricing.grillComplexity[grillType];
  };

  const getInstalledProjectCost = (baseWeight, areaSqFt, extraCost = 0) => {
    const materialCost = baseWeight * getMetalRate();
    const fabricationCost = baseWeight * getFabricationRate();
    const finishingCost = areaSqFt * (pricing.finishingRates[metalType] || 0);
    const installationCost = areaSqFt * (pricing.installationRates[grillType] || 55);
    const subtotal = materialCost + fabricationCost + finishingCost + installationCost + extraCost;

    return {
      materialCost,
      laborCost: fabricationCost + finishingCost + installationCost,
      designCost: extraCost,
      cost: Math.max(pricing.minimumCharge, subtotal),
      minimumApplied: subtotal > 0 && subtotal < pricing.minimumCharge
    };
  };

	// Calculate using practical fabrication formula when advanced mode is active
	const calculateResults = () => {
    // Safety check for valid dimensions
    if (!widthInCm || !heightInCm || widthInCm <= 0 || heightInCm <= 0) {
      return {
        weight: 0,
        cost: 0,
        materialCost: 0,
        laborCost: 0,
        designCost: 0,
        totalBarLength: 0,
        numberOfBars: 0,
        wastageWeight: 0,
        totalLinearMeters: 0,
        linearFactor: 0,
        profileWeight: 0,
        grillAreaSqMeters: 0,
        minimumApplied: false
      };
    }

  // Rod-based calculation for window grills (per unit, then scaled by quantity)
  if (grillType === 'window') {
      const widthInFt = convertToFeet(width, widthUnit);
      const heightInFt = convertToFeet(height, heightUnit);

      // Calculate total rod length
      const verticalRodLength = verticalRods * heightInFt; // feet
      const horizontalRodLength = horizontalRods * widthInFt; // feet
      const totalRodLengthFt = verticalRodLength + horizontalRodLength;
      const totalRodLengthMm = totalRodLengthFt * 304.8; // Convert to mm
      const frameLengthFt = 2 * (widthInFt + heightInFt);
      const frameLengthMeters = frameLengthFt * 0.3048;

      // Get rod diameter from profile type
      let rodDiameter = 10; // default 10mm
      if (profileType.includes('8mm')) rodDiameter = 8;
      else if (profileType.includes('10mm')) rodDiameter = 10;
      else if (profileType.includes('12mm')) rodDiameter = 12;

	    // Rod weight: square bar = d² × 0.00785 kg/m, round bar = d² × 0.006165 kg/m.
	    // Square rod is the practical default for window grills.
	    const rodShapeFactor = profileType.startsWith('sq_rod') ? 0.00785 : 0.006165;
	    const rodWeight = (Math.pow(rodDiameter, 2) * totalRodLengthMm * rodShapeFactor) / 1000;

	    const frameWeight = frameLengthMeters * (weightPerMeter.angle?.[metalType] || 1.12);

	    // Apply material density factor per unit
	    const materialFactor = metalType === 'aluminum' ? 0.35 :
	                         metalType === 'iron' ? 0.95 : 1.0;
	    const wastageFactor = 1 + (pricing.wastagePercent / 100);
	    const unitBaseWeight = (rodWeight * materialFactor) + frameWeight;
	    const unitWeight = unitBaseWeight * wastageFactor;
	    const unitAreaSqFt = widthInFt * heightInFt;

	    const qty = numericQuantity;
	    const totalWeight = unitWeight * qty;
	    const totalAreaSqFt = unitAreaSqFt * qty;
	    const { cost, materialCost, laborCost, designCost, minimumApplied } = getInstalledProjectCost(totalWeight, totalAreaSqFt);

	    return {
	      weight: totalWeight,
	      cost,
	      materialCost,
	      laborCost,
	      designCost,
	      minimumApplied,
	      totalBarLength: (totalRodLengthFt + frameLengthFt) * qty,
	      numberOfBars: (verticalRods + horizontalRods) * qty,
	      wastageWeight: totalWeight - (unitBaseWeight * qty),
	      totalLinearMeters: (totalRodLengthFt + frameLengthFt) * 0.3048 * qty,
	      linearFactor: 0,
	      profileWeight: rodWeight / (totalRodLengthFt * 0.3048),
	      grillAreaSqMeters: (widthInFt * heightInFt) * 0.092903 * qty,
	      rodDetails: {
	        verticalRods,
	        horizontalRods,
	        rodDiameter,
	        verticalRodLength,
	        horizontalRodLength,
	        frameLengthFt,
	        totalRodLengthFt: totalRodLengthFt + frameLengthFt
	      }
	    };
	  } else if (grillType === 'balcony') {
	    // SHOP FORMULA — angle frame + square rod infill, per-unit then scaled by qty
	    const W_in = widthInCm / 2.54;
	    const H_in = heightInCm / 2.54;
	    const balconyResult = calculateBalconyGrill({
	      W_in,
	      H_in,
	      qty: numericQuantity,
	      check: parseInt(balconyCheck, 10),
	      type: balconyType,
	    });
	    const widthFt = widthInCm / 30.48;
	    const heightFt = heightInCm / 30.48;
	    const areaSqFt = widthFt * heightFt * numericQuantity;
	    const grillAreaSqMeters = (widthInCm / 100) * (heightInCm / 100) * numericQuantity;
	    const totalLengthMeters = (balconyResult.breakdown.totalLengthIn / 39.3701) * numericQuantity;
	    const totalWeight = balconyResult.total.weightKg;
	    const { cost, materialCost, laborCost, designCost, minimumApplied } = getInstalledProjectCost(totalWeight, areaSqFt);
	    return {
	      weight: totalWeight,
	      cost,
	      materialCost,
	      laborCost,
	      designCost,
	      minimumApplied,
	      totalBarLength: 0,
	      numberOfBars: balconyResult.breakdown.nVert + balconyResult.breakdown.nHorz,
	      wastageWeight: totalWeight * (BALCONY_CONFIG.WASTAGE_PCT / 100) / (1 + BALCONY_CONFIG.WASTAGE_PCT / 100),
	      totalLinearMeters: totalLengthMeters,
	      linearFactor: 0,
	      profileWeight: 0,
	      grillAreaSqMeters,
	      balconyBreakdown: balconyResult,
	    };
	  } else if (showAdvancedCalculator) {
	    // PRACTICAL FABRICATION FORMULA (per unit, then scaled by quantity)
      // Step 1: Calculate area in square feet
      const widthInFeet = (widthInCm * 0.0328084);
      const heightInFeet = (heightInCm * 0.0328084);
	    const grillAreaSqFt = widthInFeet * heightInFeet;
	    const grillAreaSqMeters = grillAreaSqFt * 0.092903; // Convert to sq meters for display (per unit)

      // Step 2: Calculate number of bars and total length
      const spacingInches = parseFloat(barSpacing) || designTypeConfig[designType].barSpacingDefault;
      const widthInInches = widthInFeet * 12;
      const numberOfBars = Math.ceil(widthInInches / spacingInches);
      const totalBarLength = numberOfBars * heightInFeet; // vertical bars only for now

      // Step 3: Apply design complexity factor
      const complexityFactor = designTypeConfig[designType].complexityFactor;
	    const adjustedBarLength = totalBarLength * complexityFactor;

	    // Step 4: Calculate weight with wastage (per unit)
	    const baseWeightPerFoot = barWeightPerFoot['12mm']?.[profileType === 'square' ? 'square' : 'round'] || 0.89;
	    const unitBaseWeight = adjustedBarLength * baseWeightPerFoot;
	    const wastage = parseFloat(wastagePercent) || 7;
	    const unitWastageWeight = unitBaseWeight * (wastage / 100);
	    const unitWeight = unitBaseWeight + unitWastageWeight;

	    const qty = numericQuantity;
	    const totalGrillAreaSqFt = grillAreaSqFt * qty;
	    const totalGrillAreaSqMeters = grillAreaSqMeters * qty;
	    const totalBarLengthAll = totalBarLength * qty;
	    const totalAdjustedBarLengthAll = adjustedBarLength * qty;
	    const totalBaseWeight = unitBaseWeight * qty;
	    const totalWastageWeight = unitWastageWeight * qty;
	    const totalWeight = unitWeight * qty;

	    // Step 5: Calculate costs scaled by quantity
	    const installAllowance = totalGrillAreaSqFt * (parseFloat(laborRate) || 70);
	    const designCost = customDesignFactor && !isNaN(parseFloat(customDesignFactor))
	      ? totalAdjustedBarLengthAll * parseFloat(customDesignFactor)
	      : 0;
	    const installedCost = getInstalledProjectCost(totalWeight, totalGrillAreaSqFt, designCost + installAllowance);

	    // Set totalLinearMeters for display (convert from feet to meters)
	    const totalLinearMeters = totalAdjustedBarLengthAll * 0.3048;

	    // For display purposes in advanced mode
	    const linearFactor = totalLinearMeters / totalGrillAreaSqMeters;
	    const profileWeight = baseWeightPerFoot * 3.28084; // Convert to kg/meter

	    return {
	      weight: totalWeight,
	      cost: installedCost.cost,
	      materialCost: installedCost.materialCost,
	      laborCost: installedCost.laborCost + installAllowance,
	      designCost,
	      minimumApplied: installedCost.minimumApplied,
	      totalBarLength: totalBarLengthAll,
	      numberOfBars: numberOfBars * qty,
	      wastageWeight: totalWastageWeight,
	      totalLinearMeters,
	      linearFactor,
	      profileWeight,
	      grillAreaSqMeters: totalGrillAreaSqMeters
	    };
	} else {
	    // STANDARD LINEAR PROFILE METHOD (per unit, then scaled by quantity)
	    // Step 1: Calculate grill area in square meters
	    const widthInMeters = widthInCm / 100;
	    const heightInMeters = heightInCm / 100;
	    const grillAreaSqMetersUnit = widthInMeters * heightInMeters;

	    // Step 2: Calculate total linear meters of profile needed per unit
	    const linearFactor = (customLinearFactor && !isNaN(parseFloat(customLinearFactor)))
	      ? parseFloat(customLinearFactor)
	      : (linearMetersPerSqMeter[grillType] || 6);
	    const totalLinearMetersUnit = grillAreaSqMetersUnit * linearFactor;

	    // Step 3: Calculate weight using profile weight per meter per unit
	    const profileWeight = (customProfileWeight && !isNaN(parseFloat(customProfileWeight)))
	      ? parseFloat(customProfileWeight)
	      : (weightPerMeter[profileType]?.[metalType] || 1.15);
	    const baseWeightUnit = Math.max(0.1, totalLinearMetersUnit * profileWeight);
	    const wastageWeightUnit = baseWeightUnit * (pricing.wastagePercent / 100);
	    const weightUnit = baseWeightUnit + wastageWeightUnit;

	    const qty = numericQuantity;
	    const grillAreaSqMeters = grillAreaSqMetersUnit * qty;
	    const totalLinearMeters = totalLinearMetersUnit * qty;
	    const weight = weightUnit * qty;
	    const wastageWeight = wastageWeightUnit * qty;
	    const areaSqFt = grillAreaSqMeters * 10.7639;
	    const { cost, materialCost, laborCost, designCost, minimumApplied } = getInstalledProjectCost(weight, areaSqFt);

	    return {
	      weight,
	      cost,
	      materialCost,
	      laborCost,
	      designCost,
	      minimumApplied,
	      totalBarLength: 0,
	      numberOfBars: 0,
	      wastageWeight,
	      totalLinearMeters,
	      linearFactor,
	      profileWeight,
	      grillAreaSqMeters
	    };
	  }
	};

  const { weight, cost, materialCost, laborCost, designCost, totalBarLength, numberOfBars, wastageWeight, totalLinearMeters, linearFactor, profileWeight, grillAreaSqMeters, minimumApplied, balconyBreakdown } = calculateResults();

  // Track calculator usage when values change (debounced so partially-typed
  // dimensions don't flood the analytics with bogus entries)
  useEffect(() => {
    if (!(width > 0 && height > 0 && weight > 0)) return;
    const timer = setTimeout(() => {
      trackCalculatorUsage({
        calculatorType: showAdvancedCalculator ? 'advanced' : 'standard',
        grillType,
        metalType,
        profileType,
        dimensions: {
          width,
          height,
          widthUnit: widthUnit,
          heightUnit: heightUnit
        },
        estimatedWeight: weight,
        estimatedCost: cost
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [width, height, grillType, metalType, profileType, weight, cost, showAdvancedCalculator, widthUnit, heightUnit]);

	// Track contact form view when contact tab is active
	useEffect(() => {
	  if (activeTab === 'contact') {
	    trackContactFormInteraction('form_view');
	  }
	}, [activeTab]);

	// Build a WhatsApp link that sends the current calculator estimate straight
	// to the business — captures the lead at peak intent (Traya-style mobile flow).
	const buildQuoteWhatsAppUrl = () => {
	  const lines = [
	    'Hi eMetalWorks, I used your calculator and would like a quote:',
	    grillType ? `Work: ${grillType}${metalType ? ` / ${metalType}` : ''}` : null,
	    width > 0 && height > 0 ? `Size: ${width}${widthUnit} x ${height}${heightUnit}` : null,
	    quantity ? `Quantity: ${quantity}` : null,
	    weight > 0 ? `Est. weight: ${Math.round(weight)} kg` : null,
	    cost > 0 ? `Est. budget: Rs ${Math.round(cost).toLocaleString('en-IN')}` : null,
	    'Please share the final price and next steps.'
	  ].filter(Boolean);
	  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
	};

  // Open the name+phone modal, saving the WhatsApp URL to open after capture
  const handleWhatsAppQuoteClick = (e) => {
    e.preventDefault();
    setWaPendingUrl(buildQuoteWhatsAppUrl());
    setWaModal(true);
  };

  const handleWaSubmit = (e) => {
    e.preventDefault();
    if (!waName.trim() || !waPhone.trim()) return;

    // Open WhatsApp immediately — never make the user wait for the server
    setWaModal(false);
    setWaName('');
    setWaPhone('');
    window.open(waPendingUrl, '_blank', 'noopener,noreferrer');

    // Fire-and-forget lead capture in the background
    const { sessionId, visitorId } = getSessionInfo();
    fetch('/api/contact/whatsapp-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: waName.trim(),
        phone: waPhone.trim(),
        calculatorData: cost > 0 ? {
          dimensions: { width, height, widthUnit, heightUnit },
          grillType,
          metalType,
          profileType,
          quantity: parseInt(quantity) || 1,
          estimatedWeight: Math.round(weight),
          estimatedCost: Math.round(cost),
          calculatorType: 'rod_based'
        } : null,
        sessionId,
        visitorId
      })
    }).catch(() => {});
  };

	// Handle contact form input changes
	const handleContactInputChange = (e) => {
	  const { name, value } = e.target;
	  setFormErrors([]);
	  if (name === 'projectType') {
	    setHasManualProjectTypeChange(true);
	  }
	  setContactForm(prev => ({
	    ...prev,
	    [name]: value
	  }));
	};

	// Keep project type in sync with selected grill type unless user overrides
	useEffect(() => {
	  const mapped = GRILL_TYPE_TO_PROJECT_TYPE[grillType];
	  if (mapped && !hasManualProjectTypeChange) {
	    setContactForm(prev => ({
	      ...prev,
	      projectType: mapped
	    }));
	  }
	}, [grillType, hasManualProjectTypeChange]);

	const validateContactForm = (formData) => {
	  const errors = [];
	  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	  const phoneRegex = /^\+?[0-9][0-9\s().-]{7,24}$/;

	  if (!formData.name || formData.name.trim().length < 2) errors.push('Name must be at least 2 characters.');
	  if (!formData.email || !emailRegex.test(formData.email.trim())) errors.push('Enter a valid email address.');
	  if (!formData.phone || !phoneRegex.test(formData.phone.trim())) errors.push('Enter a valid phone number.');
	  if (!formData.subject || formData.subject.trim().length < 5) errors.push('Subject must be at least 5 characters.');
	  if (!formData.message || formData.message.trim().length < 10) errors.push('Message must be at least 10 characters.');

	  return errors;
	};
	// Handle contact form submission
	const handleContactSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateContactForm(contactForm);
    if (validationErrors.length > 0) {
      setFormErrors(validationErrors);
      setSubmitStatus(null);
      return;
    }

    setFormErrors([]);
    setIsSubmitting(true);
    setSubmitStatus(null);

	    try {
	      // Determine project type using calculator as fallback
	      const mappedProjectType = GRILL_TYPE_TO_PROJECT_TYPE[grillType];
	      const contactFormWithProjectType = {
	        ...contactForm,
	        projectType: contactForm.projectType || mappedProjectType || ''
	      };

	      trackContactFormInteraction('form_submit', contactFormWithProjectType);

	      // Prepare calculator data if available and user wants to include it
	      const calculatorData = (includeCalculatorData && width > 0 && height > 0) ? {
        dimensions: {
          width,
          height,
          widthUnit,
          heightUnit
        },
	        grillType,
	        metalType,
	        profileType,
	        quantity: numericQuantity,
        estimatedWeight: weight,
        estimatedCost: cost,
        calculatorType: grillType === 'window' ? 'rod_based' : (showAdvancedCalculator ? 'advanced' : 'standard'),
        // Add rod calculation data if available
        ...(grillType === 'window' && {
          rodCalculation: {
            verticalRods,
            horizontalRods,
            rodDiameter: profileType.includes('8mm') ? 8 : profileType.includes('10mm') ? 10 : profileType.includes('12mm') ? 12 : 10,
            totalRodLength: ((verticalRods * convertToFeet(height, heightUnit)) + (horizontalRods * convertToFeet(width, widthUnit))).toFixed(1),
            verticalRodLength: (verticalRods * convertToFeet(height, heightUnit)).toFixed(1),
            horizontalRodLength: (horizontalRods * convertToFeet(width, widthUnit)).toFixed(1)
          }
        }),
        // Add advanced calculator data if available
        ...(showAdvancedCalculator && {
          designType,
          barSpacing,
          wastagePercent,
          laborRate,
          customLinearFactor,
          customProfileWeight,
          customProfileSize,
          materialCost: materialCost || 0,
          laborCost: laborCost || 0,
          totalLinearMeters: totalLinearMeters || 0
        })
	      } : null;

	      // Submit to backend (omit calculatorData entirely when there is none —
	      // the API rejects null)
	      await submitContactForm({
	        ...contactFormWithProjectType,
	        ...(calculatorData ? { calculatorData } : {})
	      });

	      setSubmitStatus('success');

	      // Reset form after successful submission (keep project type aligned with current grill type)
	      setContactForm({
	        name: '',
	        email: '',
	        phone: '',
	        subject: '',
	        message: '',
	        projectType: mappedProjectType || ''
	      });
	      setHasManualProjectTypeChange(false);

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home', shortLabel: 'Home', icon: '🏠' },
    { id: 'services', label: 'Services', shortLabel: 'Services', icon: '🔧' },
    { id: 'calculator', label: 'Get a Quote', shortLabel: 'Quote', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', shortLabel: 'Portfolio', icon: '🏗️' },
    { id: 'contact', label: 'Contact Us', shortLabel: 'Contact', icon: '📞' },
  ];

  return (
    <main className="livspace-shell min-h-screen text-steel-800 pb-16 sm:pb-0">
      {/* Desktop floating WhatsApp (mobile uses the sticky action bar below) */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with eMetalWorks on WhatsApp"
        className="fixed bottom-5 right-5 z-50 hidden sm:inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-hard transition-all duration-200 hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
      >
        <WhatsAppIcon className="h-9 w-9" />
      </a>

      {/* Mobile sticky action bar — always-available Call / WhatsApp / Quote */}
      <div className="fixed bottom-0 inset-x-0 z-50 grid grid-cols-3 border-t border-steel-200 bg-white/95 backdrop-blur-sm shadow-hard sm:hidden">
        <a
          href="tel:+919985393064"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold text-steel-700 active:bg-steel-50"
        >
          <span className="text-lg leading-none">📞</span>
          Call
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold text-white bg-[#25D366] active:bg-[#1ebe5b]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => handleTabSwitch('calculator')}
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold text-steel-700 active:bg-steel-50"
        >
          <span className="text-lg leading-none">🧮</span>
          Get Quote
        </button>
      </div>

      {/* Tabbed Content Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4">
            {/* Brand mark — hidden on mobile to preserve tab space */}
            <button
              type="button"
              onClick={() => handleTabSwitch('home')}
              className="hidden sm:block shrink-0 focus:outline-none"
              aria-label="Go to home"
            >
              <img src="/favicon.svg" alt="eMetal Works" className="w-11 h-11 rounded-2xl shadow-sm" />
            </button>
            <div className="flex-1 flex gap-1 xs:gap-2 sm:gap-4 lg:gap-6 xl:gap-8 p-1 xs:p-2 sm:p-3 livspace-tabs rounded-2xl overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`
                    flex items-center gap-1 xs:gap-2 sm:gap-3 lg:gap-4 px-2 xs:px-3 sm:px-6 lg:px-8 xl:px-10 py-2 xs:py-2.5 sm:py-3 lg:py-4 rounded-xl font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 lg:flex-1 lg:justify-center
                    ${activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-medium'
                      : 'text-steel-600 hover:text-steel-900 hover:bg-steel-50'
                    }
                  `}
                >
                  <span className="text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl font-semibold">
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.shortLabel}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {/* Home Tab */}
            {activeTab === 'home' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="livspace-home-card relative overflow-hidden rounded-3xl bg-white"
              >
                <div className="grid lg:grid-cols-[1.08fr_0.92fr] min-h-[620px]">
                  <div className="relative order-2 lg:order-1">
                    <img
                      src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=1000&fit=crop&crop=center"
                      alt="Custom steel fabrication workshop"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-steel-950/35" />
                    <div className="relative z-10 flex h-full min-h-[360px] items-end p-6 sm:p-8 lg:p-10">
                      <div className="grid w-full grid-cols-3 gap-3 rounded-lg bg-white/90 p-4 shadow-hard backdrop-blur-sm">
                        {[
                          ['15+', 'Years'],
                          ['500+', 'Projects'],
                          ['Hyderabad', 'Local team']
                        ].map(([value, label]) => (
                          <div key={value} className="text-center">
                            <div className="text-lg sm:text-2xl font-bold text-steel-900">{value}</div>
                            <div className="text-xs sm:text-sm text-steel-600">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 flex items-center px-5 py-10 sm:px-8 lg:px-12">
                    <div className="w-full">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="mb-8"
                    >
                      <p className="livspace-kicker mb-4 text-sm font-semibold uppercase">
                        Bhavya Fabrication Works
                      </p>
                      <div className="mb-5 flex flex-col items-start gap-5">
                        <h1 className="livspace-headline text-4xl sm:text-5xl lg:text-6xl font-bold text-steel-950 leading-tight">
                          eMetalWorks for custom gates, grills, railings and sheds
                        </h1>
                        <Button
                          size="lg"
                          className="w-full shrink-0 sm:w-auto !bg-blue-600 text-white shadow-glow hover:!bg-blue-700 hover:shadow-glow-lg"
                          onClick={() => handleTabSwitch('calculator')}
                          icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          }
                          iconPosition="right"
                        >
                          Get Free Estimate
                        </Button>
                      </div>
                      <p className="text-base sm:text-lg text-steel-600 mb-6 leading-relaxed">
                        A fabrication-first experience for homes, shops and apartments in Hyderabad: discuss your requirement, estimate the job, approve the design and track the work from measurement to installation.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-steel-700">
                        {[
                          "Free consultation and measurement",
                          "Transparent material estimate",
                          "MS, SS and aluminium options",
                          "Fabrication plus installation"
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                            className="livspace-feature flex items-center gap-2 rounded-lg border px-3 py-2"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{item}</span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-3"
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto"
                          href="tel:+919985393064"
                          icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          }
                        >
                          Call Now
                        </Button>
                        <Button
                          size="lg"
                          className="w-full sm:w-auto bg-[#25D366] text-white shadow-medium hover:bg-[#1ebe5d]"
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          icon={<WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                        >
                          WhatsApp
                        </Button>
                      </motion.div>
                    </motion.div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-steel-200 bg-steel-50 px-5 py-8 sm:px-8 lg:px-10">
                  <div className="grid gap-5 md:grid-cols-3">
                    {[
                      ['One-stop fabrication', 'Design, material selection, workshop fabrication and installation handled by one local team.'],
                      ['Built for real homes', 'Gates, window grills, balcony grills, staircases, sheds and shopfront work tailored to site measurements.'],
                      ['Estimate before commitment', 'Use the calculator to get a practical starting range, then send dimensions for a final quote.']
                    ].map(([title, text]) => (
                      <div key={title} className="rounded-lg border border-steel-200 bg-white p-5">
                        <h3 className="mb-2 text-lg font-bold text-steel-900">{title}</h3>
                        <p className="text-sm leading-relaxed text-steel-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-10 sm:px-8 lg:px-10">
                  <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">Explore by requirement</p>
                      <h2 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-steel-950">
                        Fabrication ideas for every space
                      </h2>
                    </div>
                    <Button variant="outline" onClick={() => handleTabSwitch('services')} className="w-full sm:w-auto">
                      View Services
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        title: 'Home safety grills',
                        text: 'Window, balcony and staircase safety work with practical spacing and clean finishes.',
                        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=700&h=520&fit=crop&crop=center'
                      },
                      {
                        title: 'Statement gates',
                        text: 'Main gates, sliding gates and shop shutters built for daily use and curb appeal.',
                        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=700&h=520&fit=crop&crop=center'
                      },
                      {
                        title: 'Parking and roof sheds',
                        text: 'Weather-ready steel structures for cars, terraces, storefronts and utility spaces.',
                        image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=700&h=520&fit=crop&crop=center'
                      },
                      {
                        title: 'Custom metalwork',
                        text: 'Frames, stands, platforms and special fabrication based on your measurements.',
                        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=700&h=520&fit=crop&crop=center'
                      }
                    ].map((item) => (
                      <div key={item.title} className="overflow-hidden rounded-lg border border-steel-200 bg-white shadow-soft">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-steel-900">{item.title}</h3>
                          <p className="mt-2 text-sm leading-relaxed text-steel-600">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-steel-200 bg-white px-5 py-10 sm:px-8 lg:px-10">
                  <div className="mb-7 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">How it works</p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-steel-950">
                      From enquiry to installation
                    </h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      ['1', 'Get Free Estimate', 'Use our calculator or WhatsApp us your dimensions — get a ballpark price instantly, no commitment.'],
                      ['2', 'We visit & measure', 'Our team comes to your site, takes exact measurements and understands your requirements.'],
                      ['3', 'You get a quote', 'We send a detailed quote with design, material and timeline. No surprises.'],
                      ['4', 'Advance, fabricate & fit', 'Pay a small advance, we build in our workshop and install at your site.']
                    ].map(([step, title, text]) => (
                      <div key={step} className="rounded-lg border border-steel-200 bg-steel-50 p-5">
                        <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">{step}</div>
                        <h3 className="text-base font-bold text-steel-900">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-steel-600">{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => goToCalculator()}
                    >
                      Get Free Estimate
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    Our <span className="text-primary-600">Services</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-3xl mx-auto leading-relaxed">
                    From custom railings to complete fabrication solutions, we deliver excellence in every project.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      title: "Balcony Grills",
                      desc: "Modern and secure designs that enhance your home's aesthetic while ensuring safety and durability.",
                      icon: ServiceIcons.railing,
                      color: "primary"
                    },
                    {
                      title: "Window Grills",
                      desc: "Custom window safety grills designed for maximum security without compromising on style.",
                      icon: ServiceIcons.grill,
                      color: "accent"
                    },
                    {
                      title: "Steel Gates",
                      desc: "Durable and stylish main gates that provide security and make a lasting first impression.",
                      icon: ServiceIcons.gate,
                      color: "success"
                    },
                    {
                      title: "Sheds",
                      desc: "Car parking and rooftop sheds built to withstand weather while maximizing space utility.",
                      icon: ServiceIcons.shed,
                      color: "warning"
                    },
                    {
                      title: "Staircase Railings",
                      desc: "Indoor and outdoor steel railings that combine safety with elegant architectural design.",
                      icon: ServiceIcons.stair,
                      color: "primary"
                    },
                    {
                      title: "Custom Fabrication",
                      desc: "Bespoke steel solutions tailored to your unique requirements and architectural vision.",
                      icon: ServiceIcons.custom,
                      color: "steel"
                    }
                  ].map((service, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                    >
                      <Card variant="elevated" className="h-full hover:shadow-glow transition-all duration-300 group">
                        <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                          <div className={`w-16 h-16 rounded-2xl bg-${service.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                            {service.icon}
                          </div>
                          <CardTitle className="text-xl sm:text-2xl font-bold text-steel-900 mb-4">
                            {service.title}
                          </CardTitle>
                          <CardDescription className="text-steel-600 leading-relaxed mb-6 flex-grow">
                            {service.desc}
                          </CardDescription>
                          <Button
                            onClick={() => goToCalculator(service.title)}
                            variant="outline"
                            className="w-full mt-auto group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300 hover:shadow-lg hover:scale-105"
                          >
                            <svg className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Get a Quote
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Calculator Tab */}
            {activeTab === 'calculator' && (
              <motion.div
                id="calculator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto scroll-mt-24"
              >
                {/* Quote Notification */}
                {quoteNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl max-w-2xl mx-auto"
                  >
                    <p className="text-green-800 font-medium text-center">
                      ✅ {quoteNotification}
                    </p>
                  </motion.div>
                )}

                {/* ===== Calculator + How-to layout ===== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Calculator card — full width on mobile, 2/3 on desktop */}
                <div className="lg:col-span-2">
                <div data-testid="estimate-panel" className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 text-white p-6 sm:p-8 shadow-xl">

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                    <img src="/favicon.svg" alt="eMetalWorks" className="w-12 h-12 rounded-2xl shadow-lg" />
                    <div>
                      <h2 className="text-2xl font-display font-bold leading-tight">
                        eMetal <span className="text-accent-400">Calculator</span>
                      </h2>
                      <p className="text-xs text-slate-400">Instant fabrication budget · Hyderabad</p>
                    </div>
                  </div>

                  {/* Dimensions + Quantity */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Dimensions &amp; Quantity</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {/* Width */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Width</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Enter width"
                          value={width || ''}
                          onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                          className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                        <select
                          value={widthUnit}
                          onChange={(e) => setWidthUnit(e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        >
                          <option className="bg-slate-800" value="ft">ft</option>
                          <option className="bg-slate-800" value="inch">inch</option>
                          <option className="bg-slate-800" value="cm">cm</option>
                          <option className="bg-slate-800" value="mm">mm</option>
                          <option className="bg-slate-800" value="m">m</option>
                        </select>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">= {widthInCm.toFixed(1)} cm</p>
                    </div>
                    {/* Height */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Height</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Enter height"
                          value={height || ''}
                          onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                          className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                        />
                        <select
                          value={heightUnit}
                          onChange={(e) => setHeightUnit(e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                        >
                          <option className="bg-slate-800" value="ft">ft</option>
                          <option className="bg-slate-800" value="inch">inch</option>
                          <option className="bg-slate-800" value="cm">cm</option>
                          <option className="bg-slate-800" value="mm">mm</option>
                          <option className="bg-slate-800" value="m">m</option>
                        </select>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">= {heightInCm.toFixed(1)} cm</p>
                    </div>
                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Number of windows/units"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-500 text-center focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">Units of this size</p>
                    </div>
                  </div>

                  {/* Work type */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Work Type</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
                    {[
                      { value: 'window', name: 'Window Grills', icon: GrillTypeIcons.window },
                      { value: 'security', name: 'Security Grills', icon: GrillTypeIcons.security },
                      { value: 'decorative', name: 'Decorative Grills', icon: GrillTypeIcons.decorative },
                      { value: 'balcony', name: 'Balcony Grills', icon: GrillTypeIcons.balcony },
                      { value: 'gate', name: 'Gate Grills', icon: GrillTypeIcons.gate },
                      { value: 'staircase', name: 'Staircase Railings', icon: GrillTypeIcons.staircase }
                    ].map((type) => (
                      <motion.div
                        key={type.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`cursor-pointer p-3 rounded-xl border transition-all duration-200 text-center ${
                          grillType === type.value
                            ? 'border-accent-400 bg-accent-400/20 text-accent-300'
                            : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/30'
                        }`}
                        onClick={() => setGrillType(type.value)}
                      >
                        <div className={`w-8 h-8 mx-auto mb-1.5 flex items-center justify-center rounded-lg ${
                          grillType === type.value ? 'bg-accent-400/20' : 'bg-white/10'
                        }`}>
                          {type.icon}
                        </div>
                        <p className="text-xs font-medium leading-tight">{type.name}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Material */}
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Material</p>
                  <select
                    value={metalType}
                    onChange={(e) => setMetalType(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent mb-1"
                  >
                    <option className="bg-slate-800" value="steel">Mild Steel - budget friendly</option>
                    <option className="bg-slate-800" value="stainless">Stainless Steel 304 - premium, low maintenance</option>
                  </select>
                  <p className="text-xs text-slate-500 mb-6">Mild steel usually needs paint. Stainless steel costs more but is easier to maintain.</p>

                  {/* Balcony-specific options — only shown when Balcony Grills is selected */}
                  {grillType === 'balcony' && (
                    <div className="mb-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Grill Style</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'box', label: 'Box (Projecting)', desc: 'Extends outward 15″ per side — common style' },
                            { value: 'plain', label: 'Plain (Flat)', desc: 'Flush with wall, simpler construction' },
                          ].map(({ value, label, desc }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBalconyType(value)}
                              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                                balconyType === value
                                  ? 'border-accent-400 bg-accent-400/20 text-accent-300'
                                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/30'
                              }`}
                            >
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs opacity-70 mt-0.5 leading-snug">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Check Size (bar gap)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: '3', label: '3″', desc: 'Fine / tight' },
                            { value: '4', label: '4″', desc: 'Standard' },
                            { value: '5', label: '5″', desc: 'Open / light' },
                          ].map(({ value, label, desc }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setBalconyCheck(value)}
                              className={`text-center p-3 rounded-xl border transition-all duration-200 ${
                                balconyCheck === value
                                  ? 'border-accent-400 bg-accent-400/20 text-accent-300'
                                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/30'
                              }`}
                            >
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs opacity-70">{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live estimate — conditional */}
                  {(widthInCm > 0 && heightInCm > 0) ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10 pt-6"
                    >
                      <p className="text-sm font-medium text-slate-300">Budget Estimate</p>
                      <p data-testid="est-cost" className="text-4xl font-extrabold tracking-tight mt-1">
                        ₹{Math.round(isNaN(cost) ? 0 : cost).toLocaleString('en-IN')}*
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {grillAreaSqMeters > 0 && cost > 0 && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300">
                            ≈ ₹{Math.round(cost / (grillAreaSqMeters * 10.7639)).toLocaleString('en-IN')}/sq.ft
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-200">
                          All-inclusive estimate
                        </span>
                      </div>
                      {minimumApplied && (
                        <p className="mt-3 text-xs font-medium text-amber-300">
                          ⚠ Minimum order charge of ₹{pricing.minimumCharge.toLocaleString('en-IN')} applied
                        </p>
                      )}

                      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-xl bg-white/10 p-3" data-testid="est-weight">
                          <p className="text-lg font-bold leading-none">{Math.round(isNaN(weight) ? 0 : weight)}</p>
                          <p className="text-[11px] text-slate-300 mt-1">kg · Est. Weight</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-lg font-bold leading-none">{(isNaN(totalLinearMeters) ? 0 : totalLinearMeters).toFixed(1)}</p>
                          <p className="text-[11px] text-slate-300 mt-1">m · Material</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-3">
                          <p className="text-lg font-bold leading-none">{numericQuantity}</p>
                          <p className="text-[11px] text-slate-300 mt-1">Quantity</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-1.5 text-sm border-t border-white/10 pt-4">
                        {[
                          ['Material', metalType === 'steel' ? 'Mild Steel' : 'Stainless Steel 304'],
                          ['Section', grillType === 'balcony' ? 'MS Angle + 10mm Sq Rod' : ({
                            square: 'Square Pipe',
                            square_heavy: 'Heavy Square Pipe',
                            round: 'Round Pipe',
                            angle: 'Angle Iron',
                            rod_8mm: '8mm Round Rod',
                            rod_10mm: '10mm Round Rod',
                            rod_12mm: '12mm Round Rod',
                            sq_rod_8mm: '8mm Square Rod',
                            sq_rod_10mm: '10mm Square Rod',
                            sq_rod_12mm: '12mm Square Rod'
                          }[profileType] || 'Standard Profile')],
                          ['Size', `${widthInCm.toFixed(0)} × ${heightInCm.toFixed(0)} cm`],
                          ['Metal rate', `₹${getMetalRate().toFixed(0)}/kg`]
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-slate-400">{label}</span>
                            <span className="font-medium text-slate-100">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Show working — balcony only */}
                      {grillType === 'balcony' && balconyBreakdown && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setShowBalconyWorking(v => !v)}
                            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                          >
                            <svg className={`w-3 h-3 transition-transform ${showBalconyWorking ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {showBalconyWorking ? 'Hide' : 'Show'} working
                          </button>
                          {showBalconyWorking && (
                            <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-4 text-xs space-y-1.5">
                              <p className="font-semibold text-slate-200 mb-2">Calculation breakdown (per unit)</p>
                              {[
                                ['Style', balconyBreakdown.breakdown.type === 'box'
                                  ? `Box — plan ${balconyBreakdown.breakdown.Wg.toFixed(0)}″ × ${balconyBreakdown.breakdown.Hg.toFixed(0)}″`
                                  : 'Plain'],
                                ['Check / pitch', `${balconyBreakdown.breakdown.checkIn}″ check → ${balconyBreakdown.breakdown.pitchIn}″ pitch`],
                                ['Frame (angle iron)', `${(balconyBreakdown.breakdown.Lframe_in / 12).toFixed(1)} ft → ${balconyBreakdown.perUnit.frameKg.toFixed(1)} kg`],
                                ['Vertical bars', `${balconyBreakdown.breakdown.nVert} × ${balconyBreakdown.breakdown.Hg.toFixed(0)}″`],
                                ['Horizontal bars', `${balconyBreakdown.breakdown.nHorz} × ${balconyBreakdown.breakdown.Wg.toFixed(0)}″`],
                                ['Rod total', `${(balconyBreakdown.breakdown.Lrod_in / 12).toFixed(1)} ft → ${balconyBreakdown.perUnit.rodKg.toFixed(1)} kg`],
                                ['Per unit (+ 5% wastage)', `${balconyBreakdown.perUnit.weightKg.toFixed(1)} kg`],
                                ['Total weight', `${numericQuantity} × ${balconyBreakdown.perUnit.weightKg.toFixed(1)} = ${balconyBreakdown.total.weightKg.toFixed(1)} kg`],
                              ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-2">
                                  <span className="text-slate-400 shrink-0">{k}</span>
                                  <span className="text-slate-200 text-right">{v}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-6 space-y-3">
                        <button
                          onClick={handleWhatsAppQuoteClick}
                          className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-lg hover:bg-[#1ebe5b] transition-colors"
                        >
                          <WhatsAppIcon className="w-5 h-5" />
                          Get this quote on WhatsApp
                        </button>
                        <button
                          onClick={() => handleTabSwitch('contact')}
                          className="w-full rounded-xl border border-white/25 px-5 py-3 font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                          Send for Final Quote
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                        *This is a rough estimate (excludes GST). Final pricing may vary based on design complexity, finishing, and installation requirements.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="border-t border-white/10 pt-6">
                      <p className="text-sm text-slate-400 text-center">Enter width and height above to see your budget estimate instantly.</p>
                    </div>
                  )}
                </div>
                </div>{/* end col-span-2 */}

                {/* How-to panel — desktop only */}
                <div className="hidden lg:flex lg:col-span-1 flex-col gap-5 sticky top-24">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 border border-white/10 shadow-xl p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent-400 mb-4">How to use</p>
                    <ol className="space-y-4">
                      {[
                        ['Enter dimensions', 'Type the width and height of your window, gate or railing. Feet is the default — switch to inch, cm or mm if needed.'],
                        ['Pick work type', 'Select the closest option. We confirm exact design before final quote.'],
                        ['Choose material', 'Mild Steel is cheaper and common. SS 304 costs more but needs no painting.'],
                        ['Get your estimate', 'The budget appears instantly. Send on WhatsApp or submit for a final measured quote.'],
                      ].map(([title, desc], i) => (
                        <li key={i} className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{title}</p>
                            <p className="text-sm text-slate-200 mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 border border-white/10 shadow-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent-400 mb-3">Good to know</p>
                    <ul className="space-y-2.5">
                      {[
                        'Estimate excludes GST',
                        'Free site visit before final quote',
                        'Market-based metal rates used',
                        'Final price after measuring on site',
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm text-white">
                          <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>{/* end how-to panel */}

                </div>{/* end grid */}
              </motion.div>
            )}

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    Our <span className="text-primary-600">Portfolio</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-3xl mx-auto leading-relaxed">
                    Explore our completed projects showcasing quality craftsmanship and innovative designs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      title: "Modern Balcony Grills",
                      category: "Residential",
                      description: "Powder-coated MS railings fabricated to site measurements for balconies and stair landings.",
                      image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop&crop=center"
                    },
                    {
                      title: "Security Window Grills",
                      category: "Residential",
                      description: "Strong window grills with practical bar spacing, clean welding and durable anti-rust finish.",
                      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center"
                    },
                    {
                      title: "Decorative Main Gate",
                      category: "Residential",
                      description: "Custom steel entrance gates with a balanced mix of security, proportion and street appeal.",
                      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&crop=center"
                    },
                    {
                      title: "Car Parking Shed",
                      category: "Residential",
                      description: "Steel frame sheds for car parking, terrace cover and utility areas with weather-ready roofing.",
                      image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop&crop=center"
                    },
                    {
                      title: "Spiral Staircase Railing",
                      category: "Commercial",
                      description: "Handrails, landing guards and staircase safety work fabricated for indoor and outdoor use.",
                      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop&crop=center"
                    },
                    {
                      title: "Custom Fabrication Work",
                      category: "Industrial",
                      description: "Frames, platforms, supports and made-to-order metalwork built from drawings or site needs.",
                      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop&crop=center"
                    }
                  ].map((project, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                    >
                      <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 group">
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                              {project.category}
                            </span>
                          </div>
                          <CardTitle className="text-xl font-bold text-steel-900 mb-3">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="text-steel-600 leading-relaxed">
                            {project.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    Contact <span className="text-primary-600">Us</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-3xl mx-auto leading-relaxed">
                    Ready to start your project? Get in touch with us for a free consultation and quote.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  {/* Contact Form */}
                  <Card>
                    <CardContent className="p-6 sm:p-8">
                      <h3 className="text-xl sm:text-2xl font-bold text-steel-900 mb-6">Send us a Message</h3>

                      {/* Success Message */}
                      {submitStatus === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-success-50 border border-success-200 rounded-xl"
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-success-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-success-800 font-medium">
                              Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Validation Message */}
                      {formErrors.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-xl"
                        >
                          <p className="text-warning-800 font-medium mb-2">Please fix the following:</p>
                          <ul className="list-disc pl-5 text-warning-800 text-sm space-y-1">
                            {formErrors.map((err) => (
                              <li key={err}>{err}</li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                      {/* Error Message */}
                      {submitStatus === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl"
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-danger-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-danger-800 font-medium">
                              Sorry, there was an error sending your message. Please try again or call us directly.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={handleContactInputChange}
                            placeholder="Your Name"
                            label="Full Name"
                            required
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            }
                          />
                          <Input
                            type="tel"
                            name="phone"
                            value={contactForm.phone}
                            onChange={handleContactInputChange}
                            placeholder="+91 98765 43210"
                            label="Phone Number"
                            required
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={handleContactInputChange}
                            placeholder="your.email@example.com"
                            label="Email Address"
                            required
                            icon={
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            }
                          />
                          <div>
                            <label className="block text-sm font-medium text-steel-700 mb-2">Project Type</label>
                            <select
                              name="projectType"
                              value={contactForm.projectType}
                              onChange={handleContactInputChange}
                              className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            >
	                              <option value="">Select Project Type</option>
	                              <option value="window_grill">Window Grills</option>
	                              <option value="security_grill">Security Grills</option>
	                              <option value="decorative_grill">Decorative Grills</option>
	                              <option value="balcony_grill">Balcony Grills</option>
	                              <option value="railing">General Railings</option>
	                              <option value="gate">Gates</option>
	                              <option value="shed">Sheds</option>
	                              <option value="staircase">Staircases</option>
	                              <option value="custom">Custom Fabrication</option>
	                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <Input
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactInputChange}
                          placeholder="Brief description of your project"
                          label="Subject"
                          required
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4.707 4.707z" />
                            </svg>
                          }
                        />
                        <div>
                          <label className="block text-sm font-medium text-steel-700 mb-2">Message</label>
                          <textarea
                            name="message"
                            value={contactForm.message}
                            onChange={handleContactInputChange}
                            rows={4}
                            placeholder="Tell us more about your project requirements, dimensions, timeline, etc."
                            className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
                            required
                          ></textarea>
                        </div>

                        {/* Calculator Data Inclusion */}
                        {(width > 0 && height > 0) && (
                          <div className="border border-steel-200 rounded-xl p-4 bg-steel-50">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="includeCalculatorData"
                                checked={includeCalculatorData}
                                onChange={(e) => setIncludeCalculatorData(e.target.checked)}
                                className="mt-1 w-4 h-4 text-primary-600 bg-white border-steel-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                              <div className="flex-1">
                                <label htmlFor="includeCalculatorData" className="text-sm font-medium text-steel-900 cursor-pointer">
                                  Include my calculator results with this message
                                </label>
                                <p className="text-xs text-steel-600 mt-1">
                                  This will help us provide a more accurate quote based on your calculations
                                </p>

                                {/* Calculator Data Preview */}
                                {includeCalculatorData && (
                                  <div className="mt-3 p-3 bg-white border border-steel-200 rounded-lg text-xs">
                                    <h4 className="font-semibold text-steel-900 mb-2">Calculator Results Preview:</h4>
	                                    <div className="grid grid-cols-2 gap-2 text-steel-700">
	  	                                      <div><span className="font-medium">Dimensions:</span> {width} × {height} {widthUnit}</div>
	  	                                      <div><span className="font-medium">Quantity:</span> {numericQuantity}</div>
                                      <div><span className="font-medium">Grill Type:</span> {grillType}</div>
                                      <div><span className="font-medium">Metal Type:</span> {metalType}</div>
                                      <div><span className="font-medium">Profile:</span> {profileType}</div>
                                      <div><span className="font-medium">Est. Weight:</span> {Math.round(weight)} kg</div>
                                      <div><span className="font-medium">Est. Cost:</span> ₹{Math.round(cost).toLocaleString('en-IN')}</div>
                                      {grillType === 'window' && (
                                        <>
                                          <div><span className="font-medium">Vertical Rods:</span> {verticalRods}</div>
                                          <div><span className="font-medium">Horizontal Rods:</span> {horizontalRods}</div>
                                          <div><span className="font-medium">Rod Diameter:</span> {profileType.includes('8mm') ? '8mm' : profileType.includes('10mm') ? '10mm' : profileType.includes('12mm') ? '12mm' : '10mm'}</div>
                                          <div><span className="font-medium">Total Rod Length:</span> {((verticalRods * convertToFeet(height, heightUnit)) + (horizontalRods * convertToFeet(width, widthUnit))).toFixed(1)}ft</div>
                                        </>
                                      )}
                                      {showAdvancedCalculator && (
                                        <>
                                          <div><span className="font-medium">Design:</span> {designType}</div>
                                          <div><span className="font-medium">Bar Spacing:</span> {barSpacing}"</div>
                                          <div><span className="font-medium">Wastage:</span> {wastagePercent}%</div>
                                          <div><span className="font-medium">Labor Rate:</span> ₹{laborRate}/sq.ft</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          loading={isSubmitting}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Sending Message...' : 'Send Message'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <div className="space-y-6 sm:space-y-8">
                    <Card>
                      <CardContent className="p-6 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-steel-900 mb-6">Get in Touch</h3>
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-steel-900 mb-1">Phone</h4>
                              <p className="text-steel-600 text-sm sm:text-base">
                                <a href="tel:+919985393064" className="hover:text-primary-600 transition-colors">
                                  +91 99853 93064
                                </a>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#25D366]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-steel-900 mb-1">WhatsApp</h4>
                              <p className="text-steel-600 text-sm sm:text-base">
                                <a
                                  href={WHATSAPP_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-[#25D366] transition-colors"
                                >
                                  Chat directly on WhatsApp
                                </a>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-steel-900 mb-1">Email</h4>
                              <div className="space-y-1">
                                <p className="text-steel-600 text-sm sm:text-base break-all">
                                  <a href="mailto:contact@emetalworks.in" className="hover:text-primary-600 transition-colors">
                                    contact@emetalworks.in
                                  </a>
                                </p>
                                <p className="text-steel-600 text-sm sm:text-base break-all">
                                  <a href="mailto:orders@emetalworks.in" className="hover:text-primary-600 transition-colors">
                                    orders@emetalworks.in
                                  </a>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-steel-900 mb-1">Address</h4>
                              <p className="text-steel-600 text-sm sm:text-base leading-relaxed">
                                Prashant Nagar, Railway Colony,<br />
                                Moula Ali, Malkajgiri,<br />
                                Telangana 500040, India
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6 sm:p-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-steel-900 mb-4">Business Hours</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-steel-600">Monday - Friday</span>
                            <span className="font-medium text-steel-900">9:00 AM - 6:00 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-steel-600">Saturday</span>
                            <span className="font-medium text-steel-900">9:00 AM - 4:00 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-steel-600">Sunday</span>
                            <span className="font-medium text-steel-900">Closed</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Professional Attribution */}
                <div className="mt-12 pt-8 border-t border-steel-200">
                  <div className="text-center">
                    <div className="max-w-2xl mx-auto">
                      <h3 className="text-lg sm:text-xl font-semibold text-steel-900 mb-3">
                        About eMetalWorks
                      </h3>
                      <p className="text-steel-600 leading-relaxed mb-4">
                        eMetalWorks is a premium digital platform providing steel fabrication and custom metalwork solutions.
                        This service is proudly powered by <strong>Bhavya Fabrication Works</strong>, bringing over 15 years of
                        expertise in quality steel fabrication to Hyderabad and surrounding areas.
                      </p>
                      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 sm:p-6">
                        <p className="text-sm sm:text-base text-steel-700 font-medium">
                          🏭 <strong>Bhavya Fabrication Works</strong> - Your Trusted Steel Fabrication Partner
                        </p>
                        <p className="text-xs sm:text-sm text-steel-600 mt-2">
                          Established in Hyderabad | 500+ Projects Completed | Quality Guaranteed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-steel-900 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/logo.svg"
                  alt="eMetalWorks icon"
                  className="h-14 w-14 rounded-xl"
                />
                <div className="text-left">
                  <div className="text-xl font-bold text-white">eMetalWorks</div>
                  <div className="text-xs text-slate-400 tracking-wide">Fabrication For Every Home</div>
                </div>
              </div>
            </div>
            <div className="border-t border-steel-700 pt-4">
              <p className="text-steel-400 text-sm">
                © 2025 <strong>Bhavya Fabrication Works</strong>. All rights reserved.
              </p>
              <p className="text-steel-500 text-xs mt-1">
                eMetalWorks is a service by Bhavya Fabrication Works, Hyderabad
              </p>
              <div className="mt-2">
                <a
                  href="/admin"
                  className="text-steel-600 hover:text-steel-400 text-xs transition-colors"
                  title="Admin Dashboard"
                >
                  Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp lead capture modal */}
      {waModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setWaModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-steel-900 mb-1">Send your quote on WhatsApp</h3>
            <p className="text-sm text-steel-500 mb-5">Enter your name and number so we can follow up.</p>
            <form onSubmit={handleWaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-steel-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={waName}
                  onChange={e => setWaName(e.target.value)}
                  placeholder="e.g. Siva"
                  required
                  className="w-full rounded-xl border border-steel-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-steel-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={waPhone}
                  onChange={e => setWaPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full rounded-xl border border-steel-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setWaModal(false)} className="flex-1 rounded-xl border border-steel-300 px-4 py-2.5 text-sm font-semibold text-steel-700 hover:bg-steel-50 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waSubmitting || !waName.trim() || !waPhone.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5b] disabled:opacity-50 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  {waSubmitting ? 'Saving…' : 'Open WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
