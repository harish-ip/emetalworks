import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardTitle, CardDescription } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  initializeTracking,
  trackTabSwitch,
  trackCalculatorUsage,
  trackContactFormInteraction,
  submitContactForm,
  trackInteraction
} from '../utils/analytics';

function HomePage() {
  // Initialize analytics
  useEffect(() => {
    initializeTracking();
  }, []);

  // Tab state
  const [activeTab, setActiveTab] = useState('home');

  // Simple calculator state
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  // Dynamic weight factor calculation state
  const [grillType, setGrillType] = useState('window'); // window, security, decorative, balcony
  const [rodThickness, setRodThickness] = useState('8mm'); // 8mm, 10mm, 12mm
  const [spacingType, setSpacingType] = useState('standard'); // standard, close, wide
  const [designComplexity, setDesignComplexity] = useState('simple'); // simple, cross, decorative

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    projectType: 'window-grill'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [includeCalculatorData, setIncludeCalculatorData] = useState(false);

  // Dynamic weight factor calculation
  const calculateWeightFactor = () => {
    let baseFactor = 1.3; // Base factor for standard window grill

    // Adjust for grill type
    switch (grillType) {
      case 'window':
        baseFactor = 1.3;
        break;
      case 'security':
        baseFactor = 2.0;
        break;
      case 'decorative':
        baseFactor = 1.2;
        break;
      case 'balcony':
        baseFactor = 2.8;
        break;
      default:
        baseFactor = 1.3;
    }

    // Adjust for rod thickness
    switch (rodThickness) {
      case '8mm':
        baseFactor *= 1.0;
        break;
      case '10mm':
        baseFactor *= 1.4;
        break;
      case '12mm':
        baseFactor *= 1.8;
        break;
      default:
        baseFactor *= 1.0;
    }

    // Adjust for spacing
    switch (spacingType) {
      case 'standard':
        baseFactor *= 1.0;
        break;
      case 'close':
        baseFactor *= 1.3;
        break;
      case 'wide':
        baseFactor *= 0.8;
        break;
      default:
        baseFactor *= 1.0;
    }

    // Adjust for design complexity
    switch (designComplexity) {
      case 'simple':
        baseFactor *= 1.0;
        break;
      case 'cross':
        baseFactor *= 1.2;
        break;
      case 'decorative':
        baseFactor *= 1.4;
        break;
      default:
        baseFactor *= 1.0;
    }

    return baseFactor;
  };

  // Calculate results
  const weightFactor = calculateWeightFactor();
  const area = width && height ? parseFloat(width) * parseFloat(height) : 0;
  const estimatedWeight = area * weightFactor;
  const estimatedCost = estimatedWeight * 102; // ₹102/kg

  // Auto-update contact form project type when grill type changes
  useEffect(() => {
    // Map grill type to project type
    const projectTypeMap = {
      'window': 'window-grill',
      'security': 'security-grill',
      'decorative': 'decorative-grill',
      'balcony': 'balcony-railing',
      'gate': 'gate-fabrication',
      'staircase': 'staircase-railing'
    };

    // Always update project type when grill type changes
    setContactForm(prev => ({
      ...prev,
      projectType: projectTypeMap[grillType] || 'window-grill'
    }));
  }, [grillType]);

  // Handle calculator data inclusion toggle
  useEffect(() => {
    if (includeCalculatorData && width > 0 && height > 0) {
      setContactForm(prev => {
        // Only auto-populate if fields are empty to preserve user input
        const shouldUpdateSubject = !prev.subject.trim();
        const shouldUpdateMessage = !prev.message.trim();

        return {
          ...prev,
          subject: shouldUpdateSubject ? `${grillType.charAt(0).toUpperCase() + grillType.slice(1)} Grill Quote Request` : prev.subject,
          message: shouldUpdateMessage ? `Hi, I'm interested in getting a quote for ${grillType} grills. Based on the calculator, I need:\n\n• Dimensions: ${width} × ${height} feet (${area.toFixed(1)} sq.ft)\n• Grill Type: ${grillType}\n• Rod Thickness: ${rodThickness}\n• Spacing: ${spacingType}\n• Design: ${designComplexity}\n• Estimated Weight: ${Math.round(estimatedWeight)} kg\n• Estimated Cost: ₹${Math.round(estimatedCost)}\n\nPlease provide a detailed quote for this project. Thank you!` : prev.message
        };
      });
    }
  }, [includeCalculatorData, width, height, area, rodThickness, spacingType, designComplexity, estimatedWeight, estimatedCost, grillType]);

  // Handle tab switching
  const handleTabSwitch = (tabId) => {
    setActiveTab(tabId);
    trackTabSwitch(tabId);
  };

  // Handle contact form input changes
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Track form submission attempt
      await trackContactFormInteraction('form_submit', contactForm);

      // Prepare calculator data if available and user wants to include it
      const calculatorData = (includeCalculatorData && width > 0 && height > 0) ? {
        dimensions: {
          width: parseFloat(width),
          height: parseFloat(height),
          area: area
        },
        specifications: {
          grillType,
          rodThickness,
          spacingType,
          designComplexity,
          weightFactor: weightFactor.toFixed(2)
        },
        results: {
          estimatedWeight: Math.round(estimatedWeight),
          estimatedCost: Math.round(estimatedCost)
        },
        calculatorType: 'dynamic_simple'
      } : null;

      // Submit to backend
      await submitContactForm({
        ...contactForm,
        calculatorData
      });

      setSubmitStatus('success');

      // Reset form after successful submission
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        projectType: 'window-grill'
      });
      setIncludeCalculatorData(false);

    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'home', label: 'Home', shortLabel: 'Home', icon: '🏠' },
    { id: 'services', label: 'Services', shortLabel: 'Services', icon: '🔧' },
    { id: 'calculator', label: 'Get a Quote', shortLabel: 'Quote', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', shortLabel: 'Portfolio', icon: '🏗️' },
    { id: 'contact', label: 'Contact Us', shortLabel: 'Contact', icon: '📞' },
  ];

  return (
    <main className="min-h-screen bg-white text-steel-800">
      {/* Tabbed Content Section */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="flex gap-1 xs:gap-2 sm:gap-4 lg:gap-6 xl:gap-8 p-1 xs:p-2 sm:p-3 bg-steel-100 rounded-2xl overflow-x-auto scrollbar-hide max-w-full lg:max-w-6xl xl:max-w-7xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-2 xs:py-3 sm:py-4 rounded-xl xs:rounded-2xl font-medium text-xs xs:text-sm sm:text-base lg:text-lg xl:text-xl transition-all duration-300 whitespace-nowrap min-w-0 flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-lg transform scale-105'
                      : 'text-steel-600 hover:text-steel-800 hover:bg-steel-50'
                  }`}
                >
                  <span className="hidden xs:inline">{tab.icon} </span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
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
              >
                <div className="text-center mb-12">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    Welcome to <span className="text-primary-600">eMetalWorks</span>
                  </h1>
                  <p className="text-lg sm:text-xl md:text-2xl text-steel-600 max-w-4xl mx-auto leading-relaxed">
                    Premium custom steel grills, railings, and fabrication services in Hyderabad.
                    Get instant quotes with our smart calculator.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
                  {[
                    {
                      title: 'Window Grills',
                      description: 'Custom window grills with 8×8mm square rods and flat bar frames',
                      icon: '🪟',
                      action: () => {
                        setGrillType('window');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Security Grills',
                      description: 'Heavy-duty security grills with reinforced construction',
                      icon: '🔒',
                      action: () => {
                        setGrillType('security');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Balcony Railings',
                      description: 'Elegant balcony railings with structural support',
                      icon: '🏗️',
                      action: () => {
                        setGrillType('balcony');
                        handleTabSwitch('calculator');
                      }
                    }
                  ].map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6 text-center">
                          <div className="text-4xl mb-4">{service.icon}</div>
                          <CardTitle className="text-xl font-bold text-steel-900 mb-3">
                            {service.title}
                          </CardTitle>
                          <CardDescription className="text-steel-600 mb-4">
                            {service.description}
                          </CardDescription>
                          <Button
                            onClick={service.action}
                            className="w-full"
                          >
                            Get Quote
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                    Our <span className="text-primary-600">Services</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-3xl mx-auto leading-relaxed">
                    Professional steel fabrication services with expert craftsmanship and quality materials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      title: 'Window Grills',
                      description: 'Custom window grills with 8×8mm square rods and 25×3mm flat bar frames. Standard spacing with professional welding.',
                      icon: '🪟',
                      features: ['8×8mm Square Rods', '25×3mm Flat Bar Frame', 'Standard 12-15" Spacing', 'Professional Welding'],
                      price: 'From ₹130/sq.ft',
                      action: () => {
                        setGrillType('window');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Security Grills',
                      description: 'Heavy-duty security grills with reinforced construction. Thicker rods and closer spacing for maximum security.',
                      icon: '🔒',
                      features: ['10×10mm Square Rods', 'Reinforced Frame', 'Close 8-10" Spacing', 'Anti-Cut Design'],
                      price: 'From ₹200/sq.ft',
                      action: () => {
                        setGrillType('security');
                        setRodThickness('10mm');
                        setSpacingType('close');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Decorative Grills',
                      description: 'Artistic decorative grills with custom patterns and designs. Perfect for enhancing your property aesthetics.',
                      icon: '🎨',
                      features: ['Custom Patterns', 'Artistic Designs', 'Premium Finish', 'Aesthetic Appeal'],
                      price: 'From ₹150/sq.ft',
                      action: () => {
                        setGrillType('decorative');
                        setDesignComplexity('decorative');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Balcony Railings',
                      description: 'Structural balcony railings with safety compliance. Heavy-duty construction for residential and commercial use.',
                      icon: '🏗️',
                      features: ['Structural Support', 'Safety Compliant', 'Heavy-Duty Build', 'Weather Resistant'],
                      price: 'From ₹280/sq.ft',
                      action: () => {
                        setGrillType('balcony');
                        setRodThickness('12mm');
                        handleTabSwitch('calculator');
                      }
                    },
                    {
                      title: 'Gate Fabrication',
                      description: 'Custom gates for residential and commercial properties. Manual and automatic gate solutions available.',
                      icon: '🚪',
                      features: ['Custom Sizes', 'Manual/Auto Options', 'Security Features', 'Durable Construction'],
                      price: 'From ₹350/sq.ft',
                      action: () => {
                        handleTabSwitch('contact');
                      }
                    },
                    {
                      title: 'Staircase Railings',
                      description: 'Safe and stylish staircase railings for indoor and outdoor use. Compliant with safety standards.',
                      icon: '🪜',
                      features: ['Safety Standards', 'Indoor/Outdoor', 'Custom Heights', 'Slip-Resistant'],
                      price: 'From ₹250/sq.ft',
                      action: () => {
                        handleTabSwitch('contact');
                      }
                    }
                  ].map((service, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="text-center mb-4">
                            <div className="text-4xl mb-3">{service.icon}</div>
                            <CardTitle className="text-xl font-bold text-steel-900 mb-2">
                              {service.title}
                            </CardTitle>
                            <div className="text-lg font-semibold text-primary-600 mb-3">
                              {service.price}
                            </div>
                          </div>

                          <CardDescription className="text-steel-600 mb-4 text-center">
                            {service.description}
                          </CardDescription>

                          <div className="mb-6">
                            <h4 className="font-semibold text-steel-900 mb-2">Features:</h4>
                            <ul className="text-sm text-steel-600 space-y-1">
                              {service.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            onClick={service.action}
                            className="w-full"
                          >
                            Get Quote
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Services Pricing Disclaimer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h5 className="font-semibold text-blue-900 mb-1">Pricing Information</h5>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        All prices shown are starting rates and may vary based on project specifications,
                        site conditions, material quality, design complexity, and installation requirements.
                        <strong> Contact us for accurate quotes</strong> tailored to your specific needs.
                      </p>
                    </div>
                  </div>
                </motion.div>
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
                    Showcasing our expertise in steel fabrication with completed projects across Hyderabad.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      title: 'Residential Window Grills',
                      category: 'Window Grills',
                      description: 'Custom window grills for a 3BHK apartment in Kondapur. 8×8mm square rods with standard spacing.',
                      specs: '12 windows, 4×5 ft each, Total: 240 sq.ft',
                      duration: '3 days',
                      location: 'Kondapur, Hyderabad'
                    },
                    {
                      title: 'Commercial Security Grills',
                      category: 'Security Grills',
                      description: 'Heavy-duty security grills for a commercial building. 10×10mm rods with close spacing for maximum security.',
                      specs: '8 large windows, 6×8 ft each, Total: 384 sq.ft',
                      duration: '5 days',
                      location: 'Gachibowli, Hyderabad'
                    },
                    {
                      title: 'Villa Balcony Railings',
                      category: 'Balcony Railings',
                      description: 'Elegant balcony railings for a luxury villa. Structural design with decorative elements.',
                      specs: '3 balconies, 120 linear ft, Total: 180 sq.ft',
                      duration: '4 days',
                      location: 'Jubilee Hills, Hyderabad'
                    },
                    {
                      title: 'Decorative Main Gate',
                      category: 'Gate Fabrication',
                      description: 'Custom decorative main gate with intricate patterns. Manual operation with security features.',
                      specs: '12×8 ft gate, Total: 96 sq.ft',
                      duration: '6 days',
                      location: 'Banjara Hills, Hyderabad'
                    },
                    {
                      title: 'Staircase Safety Railings',
                      category: 'Staircase Railings',
                      description: 'Safety-compliant staircase railings for a 4-story building. Indoor and outdoor sections.',
                      specs: '4 floors, 80 linear ft, Total: 120 sq.ft',
                      duration: '3 days',
                      location: 'Madhapur, Hyderabad'
                    },
                    {
                      title: 'Office Complex Grills',
                      category: 'Mixed Project',
                      description: 'Complete fabrication for an office complex including window grills, gates, and railings.',
                      specs: 'Mixed work, Total: 500 sq.ft',
                      duration: '10 days',
                      location: 'HITEC City, Hyderabad'
                    }
                  ].map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                              {project.category}
                            </span>
                          </div>
                          <CardTitle className="text-xl font-bold text-steel-900 mb-3">
                            {project.title}
                          </CardTitle>
                          <CardDescription className="text-steel-600 leading-relaxed mb-4">
                            {project.description}
                          </CardDescription>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-steel-600">Specifications:</span>
                              <span className="font-medium text-steel-900">{project.specs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-steel-600">Duration:</span>
                              <span className="font-medium text-steel-900">{project.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-steel-600">Location:</span>
                              <span className="font-medium text-steel-900">{project.location}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Dynamic Calculator Tab */}
            {activeTab === 'calculator' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
              >
                <Card>
                  <CardContent className="p-6 sm:p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-steel-900 mb-4 sm:mb-6">
                        Smart Grill <span className="text-primary-600">Calculator</span>
                      </h2>
                      <p className="text-base sm:text-lg md:text-xl text-steel-600 max-w-3xl mx-auto leading-relaxed">
                        Enter dimensions and select specifications - our dynamic calculator adjusts weight factors automatically.
                      </p>
                    </div>

                    {/* Dimensions Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Width (feet)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="Enter width in feet"
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Height (feet)
                          </span>
                        </label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Enter height in feet"
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Dynamic Specifications */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">Grill Type</label>
                        <select
                          value={grillType}
                          onChange={(e) => setGrillType(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="window">Window Grill (1.3x base)</option>
                          <option value="security">Security Grill (2.0x base)</option>
                          <option value="decorative">Decorative Grill (1.2x base)</option>
                          <option value="balcony">Balcony Railing (2.8x base)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">Rod Thickness</label>
                        <select
                          value={rodThickness}
                          onChange={(e) => setRodThickness(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="8mm">8×8mm Square Rod (Standard)</option>
                          <option value="10mm">10×10mm Square Rod (+40% weight)</option>
                          <option value="12mm">12×12mm Square Rod (+80% weight)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">Rod Spacing</label>
                        <select
                          value={spacingType}
                          onChange={(e) => setSpacingType(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="standard">Standard (12-15" spacing)</option>
                          <option value="close">Close Spacing (+30% weight)</option>
                          <option value="wide">Wide Spacing (-20% weight)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-steel-700 mb-2">Design Complexity</label>
                        <select
                          value={designComplexity}
                          onChange={(e) => setDesignComplexity(e.target.value)}
                          className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="simple">Simple Parallel Bars</option>
                          <option value="cross">Cross Pattern (+20% weight)</option>
                          <option value="decorative">Decorative Design (+40% weight)</option>
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Weight Factor Display */}
                    {width > 0 && height > 0 && (
                      <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Dynamic Weight Factor: {weightFactor.toFixed(2)} kg/sq.ft</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-blue-600 font-medium">Base Factor</div>
                            <div className="text-blue-800">{grillType === 'window' ? '1.3' : grillType === 'security' ? '2.0' : grillType === 'decorative' ? '1.2' : '2.8'} kg/sq.ft</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-blue-600 font-medium">Rod Thickness</div>
                            <div className="text-blue-800">{rodThickness} ({rodThickness === '8mm' ? '1.0x' : rodThickness === '10mm' ? '1.4x' : '1.8x'})</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-blue-600 font-medium">Spacing</div>
                            <div className="text-blue-800">{spacingType} ({spacingType === 'standard' ? '1.0x' : spacingType === 'close' ? '1.3x' : '0.8x'})</div>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <div className="text-blue-600 font-medium">Design</div>
                            <div className="text-blue-800">{designComplexity} ({designComplexity === 'simple' ? '1.0x' : designComplexity === 'cross' ? '1.2x' : '1.4x'})</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Results Display */}
                    {width > 0 && height > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6"
                      >
                        <h3 className="text-xl font-bold text-steel-900 mb-4 text-center">Dynamic Calculation Results</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary-600 mb-2">
                              {Math.round(estimatedWeight)} kg
                            </div>
                            <div className="text-steel-600">Estimated Weight</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-accent-600 mb-2">
                              ₹{Math.round(estimatedCost)}
                            </div>
                            <div className="text-steel-600">Total Cost</div>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-white rounded-lg">
                          <h4 className="font-semibold text-steel-900 mb-2">Calculation Details:</h4>
                          <div className="text-sm text-steel-600 space-y-1">
                            <div>• Area: {width} × {height} = {area.toFixed(1)} sq.ft</div>
                            <div>• Dynamic weight factor: {weightFactor.toFixed(2)} kg/sq.ft</div>
                            <div>• Material rate: ₹102/kg (mild steel)</div>
                            <div>• Type: {grillType} with {rodThickness} rods, {spacingType} spacing, {designComplexity} design</div>
                          </div>
                        </div>

                        {/* Cost Disclaimer */}
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="flex-1">
                              <h5 className="font-semibold text-amber-900 mb-1">Cost Estimate Disclaimer</h5>
                              <p className="text-sm text-amber-800 leading-relaxed">
                                <strong>This is an approximate estimate only.</strong> Final costs may vary based on:
                                site conditions, installation complexity, material availability, design modifications,
                                transportation charges, and current market rates. Please contact us for an accurate quote
                                after site inspection.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 text-center">
                          <Button
                            onClick={() => handleTabSwitch('contact')}
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            Get Detailed Quote
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
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
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                        >
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-green-800 font-medium">
                              Thank you! Your message has been sent successfully. We'll get back to you soon.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Error Message */}
                      {submitStatus === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
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
                          />
                          <Input
                            type="tel"
                            name="phone"
                            value={contactForm.phone}
                            onChange={handleContactInputChange}
                            placeholder="+91 98765 43210"
                            label="Phone Number"
                            required
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
                          />
                          <div>
                            <label className="block text-sm font-medium text-steel-700 mb-2">Project Type</label>
                            <select
                              name="projectType"
                              value={contactForm.projectType}
                              onChange={handleContactInputChange}
                              className="w-full px-4 py-3 border border-steel-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            >
                              <option value="window-grill">Window Grill</option>
                              <option value="security-grill">Security Grill</option>
                              <option value="balcony-railing">Balcony Railing</option>
                              <option value="decorative-grill">Decorative Grill</option>
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
                          />
                        </div>

                        {/* Include Calculator Data Option */}
                        {width > 0 && height > 0 && (
                          <div className="border border-steel-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="includeCalculatorData"
                                checked={includeCalculatorData}
                                onChange={(e) => setIncludeCalculatorData(e.target.checked)}
                                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                              />
                              <div className="flex-1">
                                <label htmlFor="includeCalculatorData" className="text-sm font-medium text-steel-900 cursor-pointer">
                                  Include my calculator results with this message
                                </label>
                                <p className="text-xs text-steel-600 mt-1">
                                  This will help us provide a more accurate quote based on your calculations
                                  {contactForm.subject.trim() || contactForm.message.trim() ?
                                    " (Will only auto-fill empty fields to preserve your input)" :
                                    " (Will auto-fill subject and message if empty)"
                                  }
                                </p>
                              </div>
                            </div>
                            {/* Calculator Data Preview */}
                            {includeCalculatorData && (
                              <div className="mt-3 p-3 bg-white border border-steel-200 rounded-lg text-xs">
                                <h4 className="font-semibold text-steel-900 mb-2">Calculator Results Preview:</h4>
                                <div className="grid grid-cols-2 gap-2 text-steel-700 mb-3">
                                  <div><span className="font-medium">Dimensions:</span> {width} × {height} ft</div>
                                  <div><span className="font-medium">Grill Type:</span> {grillType}</div>
                                  <div><span className="font-medium">Rod Thickness:</span> {rodThickness}</div>
                                  <div><span className="font-medium">Weight Factor:</span> {weightFactor.toFixed(2)} kg/sq.ft</div>
                                  <div><span className="font-medium">Est. Weight:</span> {Math.round(estimatedWeight)} kg</div>
                                  <div><span className="font-medium">Est. Cost:</span> ₹{Math.round(estimatedCost)}</div>
                                </div>
                                <div className="pt-2 border-t border-steel-200">
                                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                                    <strong>Note:</strong> This is a preliminary estimate. Final pricing will be provided after site inspection and detailed requirements discussion.
                                  </p>
                                </div>
                              </div>
                            )}
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
                        <h3 className="text-xl font-bold text-steel-900 mb-6">Contact Information</h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-steel-900">Address</h4>
                              <p className="text-steel-600">Prashant Nagar, Railway Colony<br />Moula Ali, Malkajgiri<br />Telangana 500040</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-steel-900">Phone</h4>
                              <p className="text-steel-600">+91 99853 93064</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-steel-900">Business Hours</h4>
                              <p className="text-steel-600">Monday - Saturday: 9:00 AM - 6:00 PM<br />Sunday: Closed</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
            <h3 className="text-xl font-bold mb-2">eMetalWorks</h3>
            <p className="text-steel-300 mb-4">by Bhavya Fabrication Works</p>
            <p className="text-steel-400 text-sm">
              © 2024 eMetalWorks. All rights reserved. | Premium steel fabrication services in Hyderabad.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default HomePage;