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
  trackInteraction
} from '../utils/analytics';

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
// 🔧 EASILY UPDATE THESE RATES TO MANAGE PRICING
const PRICING_CONFIG = {
  // Metal base rates per kg (₹)
  metalRates: {
    steel: 68,          // Mild Steel / MS sections
    stainless: 275,     // Stainless Steel 304 sections/pipes
    aluminum: 300,      // Aluminum sections
    iron: 75            // Iron sections
  },

  // Fabrication labour, welding, cutting, grinding and shop overhead per kg.
  fabricationRates: {
    steel: 105,
    stainless: 160,
    aluminum: 140,
    iron: 105
  },

  // Finishing and installation allowances per sq.ft.
  finishingRates: {
    steel: 45,
    stainless: 20,
    aluminum: 30,
    iron: 45
  },

  installationRates: {
    window: 55,
    security: 70,
    decorative: 85,
    balcony: 95,
    gate: 120,
    staircase: 120
  },

  // Grill complexity multipliers (affects final price)
  grillComplexity: {
    window: 1.0,        // Window Grills - Standard fabrication
    security: 1.3,      // Security Grills - Reinforced, thicker bars
    decorative: 1.5,    // Decorative Grills - Intricate designs, artistic work
    balcony: 1.2,       // Balcony Railings - Height requirements, safety standards
    gate: 1.4,          // Gate Grills - Heavy-duty hinges, locking mechanisms
    staircase: 1.6      // Staircase Railings - Complex angles, precise measurements
  },

	wastagePercent: 7,
	minimumCharge: 2500
	};

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
    window: 'rod_10mm',
    security: 'rod_12mm',
    decorative: 'square',
    balcony: 'square',
    gate: 'angle',
    staircase: 'round'
  };

  // Rod count state for window grills
  const [verticalRods, setVerticalRods] = useState(3);
  const [horizontalRods, setHorizontalRods] = useState(5);
  const [useRodCalculation, setUseRodCalculation] = useState(false);

  // Function to suggest default rod counts based on window size
  const getDefaultRodCounts = (widthFt, heightFt) => {
    // Standard spacing: 12-16 inches for vertical, 10-15 inches for horizontal
    const verticalSpacing = 15; // inches
    const horizontalSpacing = 12; // inches

    const suggestedVertical = Math.max(2, Math.ceil((widthFt * 12) / verticalSpacing));
    const suggestedHorizontal = Math.max(3, Math.ceil((heightFt * 12) / horizontalSpacing));

    return {
      vertical: Math.min(suggestedVertical, 6), // Cap at 6 for practical reasons
      horizontal: Math.min(suggestedHorizontal, 8) // Cap at 8 for practical reasons
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
    setUseRodCalculation(false);
    setShowAdvancedCalculator(false);
  }, [grillType]);

  // Advanced calculator state
  const [showAdvancedCalculator, setShowAdvancedCalculator] = useState(false);
  const [customLinearFactor, setCustomLinearFactor] = useState('');
  const [customProfileWeight, setCustomProfileWeight] = useState('');
  const [customProfileSize, setCustomProfileSize] = useState('');
  const [showAdvancedTooltip, setShowAdvancedTooltip] = useState(false);

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
        'Balcony Railings': 'balcony',
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

  // Quote notification state
  const [quoteNotification, setQuoteNotification] = useState(null); // 'success', 'error', or null

  // Linear meters of profile needed per square meter of grill area (based on design complexity)
  const linearMetersPerSqMeter = {
    window: 6,          // 6 m/m² - Simple window grills with basic grid pattern
    security: 10,       // 10 m/m² - Security grills with closer spacing and reinforcement
    decorative: 8,      // 8 m/m² - Decorative grills with artistic patterns
    balcony: 7,         // 7 m/m² - Balcony railings with posts and horizontal rails
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

  const numericQuantity = parseInt(quantity, 10) || 1;

  // Convert all dimensions to cm for calculation
  const widthInCm = convertToCm(width, widthUnit);
  const heightInCm = convertToCm(height, heightUnit);

  // Calculate final rate per kg using centralized pricing config
  const getMetalRate = () => {
    return PRICING_CONFIG.metalRates[metalType];
  };

  const getFabricationRate = () => {
    return PRICING_CONFIG.fabricationRates[metalType] * PRICING_CONFIG.grillComplexity[grillType];
  };

  const getInstalledProjectCost = (baseWeight, areaSqFt, extraCost = 0) => {
    const materialCost = baseWeight * getMetalRate();
    const fabricationCost = baseWeight * getFabricationRate();
    const finishingCost = areaSqFt * (PRICING_CONFIG.finishingRates[metalType] || 0);
    const installationCost = areaSqFt * (PRICING_CONFIG.installationRates[grillType] || 55);
    const subtotal = materialCost + fabricationCost + finishingCost + installationCost + extraCost;

    return {
      materialCost,
      laborCost: fabricationCost + finishingCost + installationCost,
      designCost: extraCost,
      cost: Math.max(PRICING_CONFIG.minimumCharge, subtotal)
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
        grillAreaSqMeters: 0
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

	    // Calculate weight using rod formula: Weight (kg) = (d² × L × 0.006165) / 1000
	    const rodWeight = (Math.pow(rodDiameter, 2) * totalRodLengthMm * 0.006165) / 1000;

	    const frameWeight = frameLengthMeters * (weightPerMeter.angle?.[metalType] || 1.12);

	    // Apply material density factor per unit
	    const materialFactor = metalType === 'aluminum' ? 0.35 :
	                         metalType === 'iron' ? 0.95 : 1.0;
	    const wastageFactor = 1 + (PRICING_CONFIG.wastagePercent / 100);
	    const unitBaseWeight = (rodWeight * materialFactor) + frameWeight;
	    const unitWeight = unitBaseWeight * wastageFactor;
	    const unitAreaSqFt = widthInFt * heightInFt;

	    const qty = numericQuantity;
	    const totalWeight = unitWeight * qty;
	    const totalAreaSqFt = unitAreaSqFt * qty;
	    const { cost, materialCost, laborCost, designCost } = getInstalledProjectCost(totalWeight, totalAreaSqFt);

	    return {
	      weight: totalWeight,
	      cost,
	      materialCost,
	      laborCost,
	      designCost,
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
	    const wastageWeightUnit = baseWeightUnit * (PRICING_CONFIG.wastagePercent / 100);
	    const weightUnit = baseWeightUnit + wastageWeightUnit;

	    const qty = numericQuantity;
	    const grillAreaSqMeters = grillAreaSqMetersUnit * qty;
	    const totalLinearMeters = totalLinearMetersUnit * qty;
	    const weight = weightUnit * qty;
	    const wastageWeight = wastageWeightUnit * qty;
	    const areaSqFt = grillAreaSqMeters * 10.7639;
	    const { cost, materialCost, laborCost, designCost } = getInstalledProjectCost(weight, areaSqFt);

	    return {
	      weight,
	      cost,
	      materialCost,
	      laborCost,
	      designCost,
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

  const { weight, cost, materialCost, laborCost, designCost, totalBarLength, numberOfBars, wastageWeight, totalLinearMeters, linearFactor, profileWeight, grillAreaSqMeters } = calculateResults();

  // Track calculator usage when values change
  useEffect(() => {
    if (width > 0 && height > 0 && weight > 0) {
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
    }
  }, [width, height, grillType, metalType, profileType, weight, cost, showAdvancedCalculator, widthUnit, heightUnit]);

	// Track contact form view when contact tab is active
	useEffect(() => {
	  if (activeTab === 'contact') {
	    trackContactFormInteraction('form_view');
	  }
	}, [activeTab]);

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

	      // Submit to backend
	      await submitContactForm({
	        ...contactFormWithProjectType,
	        calculatorData
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
    <main className="livspace-shell min-h-screen text-steel-800">
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with eMetalWorks on WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-hard transition-all duration-200 hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 sm:h-16 sm:w-16"
      >
        <WhatsAppIcon className="h-8 w-8 sm:h-9 sm:w-9" />
      </a>

      {/* Tabbed Content Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="flex gap-1 xs:gap-2 sm:gap-4 lg:gap-6 xl:gap-8 p-1 xs:p-2 sm:p-3 livspace-tabs rounded-2xl overflow-x-auto scrollbar-hide max-w-full lg:max-w-6xl xl:max-w-7xl">
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
                      ['Built for real homes', 'Gates, window grills, balcony railings, staircases, sheds and shopfront work tailored to site measurements.'],
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
                      From first call to final fitting
                    </h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      ['1', 'Tell us the job', 'Share photos, dimensions or book a site visit.'],
                      ['2', 'Get an estimate', 'Use the calculator or request a measured quote.'],
                      ['3', 'Approve design', 'Confirm material, finish, pattern and timeline.'],
                      ['4', 'Fabricate and install', 'Workshop build, site fitting and final quality check.']
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
                      Get an Estimate
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
                      title: "Balcony Railings",
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
                className="max-w-4xl mx-auto scroll-mt-24"
              >
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    eMetalWorks <span className="text-accent-600">Calculator</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-2xl mx-auto leading-relaxed">
                    Get a simple budget estimate for your fabrication work. Choose the work type, material, and enter approximate width and height.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-2xl mx-auto">
                    <p className="text-sm text-blue-800 text-center">
                      <span className="font-medium">Quick estimate:</span> Feet is selected by default. Final quotation depends on site measurement, design, finish and installation.
                    </p>
                  </div>
                </div>

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

                <Card variant="glass" className="backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6 lg:p-8 xl:p-12">
                    {/* Dimensions with Unit Converter */}
                    <div className="mb-4">
                      <p className="text-sm text-steel-600 text-center">
                        <strong>Enter approximate dimensions:</strong> Width (horizontal) x Height (vertical)
                      </p>
                    </div>
	                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      {/* Width Input with Unit Selection */}
                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Width
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Enter width"
                            value={width || ''}
                            onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                            className="text-center flex-1"
                          />
                          <select
                            value={widthUnit}
                            onChange={(e) => setWidthUnit(e.target.value)}
                            className="px-3 py-2 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
                          >
                            <option value="ft">ft</option>
                            <option value="inch">inch</option>
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                        <p className="text-xs text-steel-500 mt-1">
                          = {widthInCm.toFixed(1)} cm
                        </p>
                      </div>

	                    {/* Height Input with Unit Selection */}
	                    <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Height
                          </span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Enter height"
                            value={height || ''}
                            onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                            className="text-center flex-1"
                          />
                          <select
                            value={heightUnit}
                            onChange={(e) => setHeightUnit(e.target.value)}
                            className="px-3 py-2 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-sm"
                          >
                            <option value="ft">ft</option>
                            <option value="inch">inch</option>
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                        <p className="text-xs text-steel-500 mt-1">
                          = {heightInCm.toFixed(1)} cm
                        </p>
	                      </div>
	                    </div>

	                    {/* Quantity Input */}
	                    <div>
	                      <label className="block text-sm font-medium text-steel-700 mb-2">
	                        <span className="flex items-center gap-2">
	                          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
	                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
	                          </svg>
	                          Quantity
	                        </span>
	                      </label>
	                      <Input
	                        type="number"
	                        min="1"
	                        placeholder="Number of windows/units"
	                        value={quantity}
	                        onChange={(e) => setQuantity(e.target.value)}
	                        className="text-center"
	                      />
	                      <p className="text-xs text-steel-500 mt-1">
	                        How many windows/units of this size you need.
	                      </p>
	                    </div>

                    <div className="rounded-xl border border-steel-200 bg-steel-50 p-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
                      <h4 className="font-semibold text-steel-900 mb-2">We will confirm the technical details</h4>
                      <p className="text-sm text-steel-600 leading-relaxed">
                        You do not need to choose rod size, pipe section, paint or fitting method here. This estimate uses common market assumptions; our team will check the site and share a final quote.
                      </p>
                    </div>

                    {/* Grill Type Selection - Tiles */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-steel-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        What do you need?
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                        {[
                          { value: 'window', name: 'Window Grills', icon: GrillTypeIcons.window, color: 'accent' },
                          { value: 'security', name: 'Security Grills', icon: GrillTypeIcons.security, color: 'success' },
                          { value: 'decorative', name: 'Decorative Grills', icon: GrillTypeIcons.decorative, color: 'warning' },
                          { value: 'balcony', name: 'Balcony Railings', icon: GrillTypeIcons.balcony, color: 'primary' },
                          { value: 'gate', name: 'Gate Grills', icon: GrillTypeIcons.gate, color: 'steel' },
                          { value: 'staircase', name: 'Staircase Railings', icon: GrillTypeIcons.staircase, color: 'primary' }
                        ].map((type) => (
                          <motion.div
                            key={type.value}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`cursor-pointer p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                              grillType === type.value
                                ? `border-${type.color}-500 bg-${type.color}-50 shadow-lg`
                                : 'border-steel-200 bg-white hover:border-steel-300 hover:shadow-md'
                            }`}
                            onClick={() => setGrillType(type.value)}
                          >
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 flex items-center justify-center rounded-lg ${
                              grillType === type.value ? `bg-${type.color}-100` : 'bg-steel-100'
                            }`}>
                              <div className={grillType === type.value ? `text-${type.color}-600` : 'text-steel-600'}>
                                {type.icon}
                              </div>
                            </div>
                            <p className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                              grillType === type.value ? `text-${type.color}-700` : 'text-steel-700'
                            }`}>
                              {type.name}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      <p className="text-xs text-steel-500 mt-3 text-center">
                        Pick the closest option. We will confirm the exact design and section size before final quote.
                      </p>
                    </div>

                    {/* Customer-friendly material selection */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-2xl mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Material
                          </span>
                        </label>
                        <select
                          value={metalType}
                          onChange={(e) => setMetalType(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <option value="steel">Mild Steel - budget friendly</option>
                          <option value="stainless">Stainless Steel 304 - premium, low maintenance</option>
                        </select>
                        <p className="text-xs text-steel-500 mt-1">
                          Mild steel usually needs paint. Stainless steel costs more but is easier to maintain.
                        </p>
                      </div>

                      {/* Profile Type Selection */}
                      <div className="hidden">
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Profile Type
                          </span>
                        </label>
                        <select
                          value={profileType}
                          onChange={(e) => setProfileType(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white"
                        >
                          <optgroup label="Standard Profiles">
                            <option value="square">Square Pipe (20×20×2mm) - {weightPerMeter.square?.[metalType] || 1.15} kg/m</option>
                            <option value="round">Round Pipe (20mm dia×2mm wall) - {weightPerMeter.round?.[metalType] || 0.89} kg/m</option>
                            <option value="angle">Angle Iron (25×25×3mm) - {weightPerMeter.angle?.[metalType] || 1.78} kg/m</option>
                          </optgroup>
                          <optgroup label="Rod Thickness (for Window Grills)">
                            <option value="rod_8mm">8mm Round Rod - {weightPerMeter.rod_8mm?.[metalType] || 0.39} kg/m</option>
                            <option value="rod_10mm">10mm Round Rod - {weightPerMeter.rod_10mm?.[metalType] || 0.62} kg/m</option>
                            <option value="rod_12mm">12mm Round Rod - {weightPerMeter.rod_12mm?.[metalType] || 0.89} kg/m</option>
                          </optgroup>
                        </select>
                        <p className="text-xs text-steel-500 mt-1">
                          Choose profile type: Standard pipes/angles for structural work, or rod thickness (8mm/10mm/12mm) for window grills. Weights shown for {metalType === 'steel' ? 'mild steel' : metalType === 'stainless' ? 'stainless steel' : metalType === 'aluminum' ? 'aluminum' : 'cast iron'}.
                        </p>
                      </div>
                    </div>

                    {/* Rod Count Calculator for Window Grills */}
                    {false && grillType === 'window' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-green-50 rounded-xl p-4 sm:p-6 mb-6 border border-green-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Rod-Based Calculation
                          </h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={useRodCalculation}
                              onChange={(e) => setUseRodCalculation(e.target.checked)}
                              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-green-700">Use Rod Count Method</span>
                          </label>
                        </div>

                        {useRodCalculation && (
                          <div className="space-y-4">
                            <p className="text-sm text-green-700 mb-4">
                              Calculate based on actual number of rods needed for your window grill. Default values are suggested based on standard spacing.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-green-700 mb-2">
                                  Vertical Rods
                                </label>
                                <input
                                  type="number"
                                  min="2"
                                  max="10"
                                  value={verticalRods}
                                  onChange={(e) => setVerticalRods(parseInt(e.target.value) || 2)}
                                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                                  placeholder="Number of vertical rods"
                                />
                                <p className="text-xs text-green-600 mt-1">
                                  Suggested: {width && height ? getDefaultRodCounts(convertToFeet(width, widthUnit), convertToFeet(height, heightUnit)).vertical : 3} rods (12-16" spacing)
                                </p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-green-700 mb-2">
                                  Horizontal Rods
                                </label>
                                <input
                                  type="number"
                                  min="3"
                                  max="12"
                                  value={horizontalRods}
                                  onChange={(e) => setHorizontalRods(parseInt(e.target.value) || 3)}
                                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white"
                                  placeholder="Number of horizontal rods"
                                />
                                <p className="text-xs text-green-600 mt-1">
                                  Suggested: {width && height ? getDefaultRodCounts(convertToFeet(width, widthUnit), convertToFeet(height, heightUnit)).horizontal : 5} rods (10-15" spacing)
                                </p>
                              </div>
                            </div>

                            {width && height && (
                              <div className="bg-white rounded-lg p-3 border border-green-200">
                                <p className="text-sm text-green-800">
                                  <strong>Rod Configuration:</strong> {verticalRods} vertical × {convertToFeet(height, heightUnit).toFixed(1)}ft + {horizontalRods} horizontal × {convertToFeet(width, widthUnit).toFixed(1)}ft = {((verticalRods * convertToFeet(height, heightUnit)) + (horizontalRods * convertToFeet(width, widthUnit))).toFixed(1)} total feet
                                </p>
                              </div>
                            )}

                            {/* Standard Rod Configuration Reference */}
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <h5 className="text-sm font-semibold text-green-800 mb-2">📏 Standard Rod Configurations:</h5>
                              <div className="text-xs text-green-700 space-y-1">
                                <div className="grid grid-cols-3 gap-2 font-medium border-b border-green-200 pb-1">
                                  <span>Window Size</span>
                                  <span>Vertical Rods</span>
                                  <span>Horizontal Rods</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span>3×4 ft</span>
                                  <span>2-3 rods</span>
                                  <span>4 rods</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span>4×5 ft</span>
                                  <span>3-4 rods</span>
                                  <span>5 rods</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <span>5×6 ft</span>
                                  <span>4-5 rods</span>
                                  <span>6 rods</span>
                                </div>
                              </div>
                              <p className="text-xs text-green-600 mt-2">
                                <strong>💡 Tip:</strong> Standard spacing is 12-16" for vertical rods and 10-15" for horizontal rods. More rods = better security, fewer rods = better view.
                              </p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Advanced Calculator Options */}
                    {false && showAdvancedCalculator && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-blue-50 rounded-xl p-4 sm:p-6 mb-6 border border-blue-200"
                      >
                        <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          🏠 Practical Fabrication Calculator
                        </h4>

                        <div className="bg-green-100 rounded-lg p-3 mb-4">
                          <p className="text-xs text-green-800">
                            <strong>🔧 Professional Formula:</strong> Uses industry-standard fabrication pricing with bar spacing, wastage, labor costs, and design complexity factors.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Design Type */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Design Type
                            </label>
                            <select
                              value={designType}
                              onChange={(e) => setDesignType(e.target.value)}
                              className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="simple">Simple (×1.0) - Basic vertical bars</option>
                              <option value="medium">Medium (×1.3) - Some horizontal bars</option>
                              <option value="heavy">Heavy (×1.6) - Complex patterns</option>
                            </select>
                            <p className="text-xs text-blue-600 mt-1">
                              Affects complexity factor and default spacing
                            </p>
                          </div>

                          {/* Bar Spacing */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Bar Spacing (inches)
                            </label>
                            <Input
                              type="number"
                              step="0.5"
                              placeholder={`Default: ${designTypeConfig[designType].barSpacingDefault}`}
                              value={barSpacing}
                              onChange={(e) => setBarSpacing(e.target.value)}
                              className="text-center"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              Distance between vertical bars
                            </p>
                          </div>

                          {/* Wastage Percentage */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Wastage % (5-10%)
                            </label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              max="20"
                              placeholder="7"
                              value={wastagePercent}
                              onChange={(e) => setWastagePercent(e.target.value)}
                              className="text-center"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              Material wastage during fabrication
                            </p>
                          </div>

                          {/* Labor Rate */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Labor Rate (₹/sq.ft)
                            </label>
                            <Input
                              type="number"
                              step="10"
                              placeholder="80"
                              value={laborRate}
                              onChange={(e) => setLaborRate(e.target.value)}
                              className="text-center"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              Labor charges per square foot
                            </p>
                          </div>
                        </div>

                        {/* Custom Design Factor (Optional) */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-blue-700 mb-2">
                            Custom Design Factor (₹/foot) - Optional
                          </label>
                          <Input
                            type="number"
                            step="1"
                            placeholder="e.g., 15 for decorative work"
                            value={customDesignFactor}
                            onChange={(e) => setCustomDesignFactor(e.target.value)}
                            className="text-center max-w-xs"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Additional charges per foot for fancy/decorative work
                          </p>
                        </div>

                        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                          <p className="text-xs text-blue-800">
                            <strong>💡 Pro Tip:</strong> Leave fields empty to use standard values.
                            {customLinearFactor && !isNaN(parseFloat(customLinearFactor)) && (
                              <span> Using custom linear factor: {customLinearFactor} m/m².</span>
                            )}
                            {customProfileWeight && !isNaN(parseFloat(customProfileWeight)) && (
                              <span> Using custom profile weight: {customProfileWeight} kg/m.</span>
                            )}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Results */}
                    {(widthInCm > 0 && heightInCm > 0) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8"
                      >
                        {/* Project Summary */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-soft mb-6">
                          <h4 className="text-lg font-semibold text-steel-900 mb-4 text-center">Project Summary</h4>
	                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                            <div className="text-center hidden">
                              <div className="font-medium text-steel-900">
                                {grillType.charAt(0).toUpperCase() + grillType.slice(1).replace(/([A-Z])/g, ' $1')}
                              </div>
                              <div className="text-steel-500">Grill Type</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-steel-900">
                                {metalType === 'steel' ? 'Mild Steel' :
                                 metalType === 'stainless' ? 'Stainless Steel' :
                                 metalType === 'aluminum' ? 'Aluminum' : 'Cast Iron'}
                              </div>
                              <div className="text-steel-500">Metal Type</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-steel-900">
                                {profileType === 'square' ? 'Square Pipe' :
                                 profileType === 'round' ? 'Round Pipe' : 'Angle Iron'}
                              </div>
                              <div className="text-steel-500">Profile Type</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-steel-900">
                                {widthInCm.toFixed(1)} × {heightInCm.toFixed(1)} cm
                              </div>
                              <div className="text-steel-500">W × H (converted)</div>
                            </div>
	                            <div className="text-center">
	                              <div className="font-medium text-steel-900">
	                                {numericQuantity}
	                              </div>
	                              <div className="text-steel-500">Quantity</div>
	                            </div>
                            {showAdvancedCalculator ? (
                              <>
                                <div className="text-center">
                                  <div className="font-medium text-steel-900">
                                    {numberOfBars || 0} bars
                                  </div>
                                  <div className="text-steel-500">Number of Bars</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-steel-900">
                                    {totalBarLength ? totalBarLength.toFixed(1) : 0} ft
                                  </div>
                                  <div className="text-steel-500">Total Bar Length</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-center">
                                  <div className="font-medium text-steel-900">
                                    {(isNaN(totalLinearMeters) ? 0 : totalLinearMeters).toFixed(1)} meters
                                  </div>
                                  <div className="text-steel-500">Total Profile Length</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-steel-900">
                                    ₹{getMetalRate().toFixed(0)}/kg
                                  </div>
                                  <div className="text-steel-500">Rate</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-center">
                          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-soft">
                            <div className="text-2xl sm:text-3xl font-bold text-primary-600 mb-2">
                              {Math.round(isNaN(weight) ? 0 : weight)} kg
                            </div>
                            <div className="text-steel-600 font-medium">Estimated Weight</div>
                            <div className="text-xs text-steel-500 mt-1">
                              Approximate fabrication weight based on selected work type and material.
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-soft">
                            <div className="text-2xl sm:text-3xl font-bold text-accent-600 mb-2">
                              ₹{(isNaN(cost) ? 0 : cost).toFixed(0)}
                            </div>
                            <div className="text-steel-600 font-medium">
                              Budget Estimate
                            </div>
                            <div className="text-xs text-steel-500 mt-1">
                              Includes material, fabrication, finish and installation allowance
                            </div>
                          </div>
                        </div>

                        {/* Advanced Calculator Cost Breakdown */}
                        {showAdvancedCalculator && (
                          <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                            <h5 className="font-semibold text-green-800 mb-3 text-center">💰 Detailed Cost Breakdown</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-bold text-green-600">₹{(materialCost || 0).toFixed(0)}</div>
                                <div className="text-green-700">Material Cost</div>
                                <div className="text-xs text-green-600 mt-1">
                                  {Math.round(weight || 0)} kg × ₹{getMetalRate().toFixed(0)}/kg
                                  {wastageWeight > 0 && (
                                    <div>+ {wastagePercent}% wastage</div>
                                  )}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-bold text-blue-600">₹{(laborCost || 0).toFixed(0)}</div>
                                <div className="text-blue-700">Labor Cost</div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {Math.round((widthInCm * 0.0328084) * (heightInCm * 0.0328084))} sq.ft × ₹{laborRate || 80}/sq.ft
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="font-bold text-purple-600">₹{(designCost || 0).toFixed(0)}</div>
                                <div className="text-purple-700">Design Cost</div>
                                <div className="text-xs text-purple-600 mt-1">
                                  {designCost > 0 ? `${totalBarLength?.toFixed(1) || 0} ft × ₹${customDesignFactor}/ft` : 'No custom design'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-center mt-4 sm:mt-6">
                          <div className="bg-blue-50 rounded-lg p-3 mb-4 hidden">
                            <p className="text-xs text-blue-700 mb-2">
                              <strong>💡 {showAdvancedCalculator ? 'Advanced' : 'Professional'} Weight Calculation:</strong> Uses linear profile method - {linearFactor} meters of {customProfileSize || profileType} profile per sq meter for {grillType} grills, weighing {profileWeight.toFixed(2)} kg/meter.
                              {showAdvancedCalculator && (customLinearFactor || customProfileWeight) && (
                                <span className="text-orange-600"> (Using custom values)</span>
                              )}
                            </p>
                            <p className="text-xs text-blue-600">
                              <strong>Calculation:</strong> {Math.round(isNaN(grillAreaSqMeters) ? 0 : grillAreaSqMeters)} m² × {Math.round(linearFactor)} m/m² × {Math.round(profileWeight)} kg/m = {Math.round(isNaN(weight) ? 0 : weight)} kg
                            </p>
                            {(profileType?.includes('rod_') || profileType?.includes('mm')) && (
                              <p className="text-xs text-green-600 mt-1">
                                <strong>📏 Rod Weight Formula:</strong> For round rods, weight = d² × 0.006165 kg/m (where d = diameter in mm)
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-steel-500 mb-4">
                            *This is a rough estimate. Final pricing may vary based on design complexity, finishing, and installation requirements.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <div className="relative hidden">
                              <Button
                                variant="outline"
                                onClick={() => setShowAdvancedCalculator(!showAdvancedCalculator)}
                                onMouseEnter={() => setShowAdvancedTooltip(true)}
                                onMouseLeave={() => setShowAdvancedTooltip(false)}
                                className="w-full sm:w-auto"
                              >
                                🔧 {showAdvancedCalculator ? 'Simple Calculator' : 'Advanced Calculator'}
                              </Button>

                              {/* Tooltip */}
                              {showAdvancedTooltip && !showAdvancedCalculator && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-lg">
                                    <div className="font-semibold mb-1">🏠 Use Practical Fabrication Calculator for:</div>
                                    <ul className="text-left space-y-1">
                                      <li>• Real fabrication pricing with labor costs</li>
                                      <li>• Bar spacing and wastage calculations</li>
                                      <li>• Design complexity factors</li>
                                      <li>• Professional quotations</li>
                                    </ul>
                                    <div className="text-center mt-1 text-gray-300">
                                      Click to expand advanced options
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                      <div className="border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleTabSwitch('contact')}
                              className="w-full sm:w-auto"
                            >
                              Send for Final Quote
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
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
                      title: "Modern Balcony Railings",
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
	                              <option value="balcony_grill">Balcony Railings</option>
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
                                      <div><span className="font-medium">Est. Cost:</span> ₹{Math.round(cost)}</div>
                                      {useRodCalculation && grillType === 'window' && (
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
              <h3 className="text-xl font-bold text-primary-400 mb-2">eMetalWorks</h3>
              <p className="text-steel-300 text-sm">
                Premium Steel Fabrication & Custom Metalwork Solutions
              </p>
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
    </main>
  );
}
