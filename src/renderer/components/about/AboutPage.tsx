// src/renderer/src/components/about/AboutPage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Info, 
  Mail, 
  User, 
  Phone, 
  Globe, 
  Linkedin,
  Home,
  CreditCard,
  Package,
  FileText,
  Users,
  BarChart3,
  Truck,
  Settings,
  Shield,
  Database,
  RefreshCw,
  Zap
} from 'lucide-react';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  const appVersion = '2.3.9';
  
  const contactInfo = [
    {
      icon: <Mail size={20} />,
      label: 'Support Email',
      value: 'farouk@zunobotics.com',
      link: 'mailto:farouk@zunobotics.com'
    },

    {
      icon: <Phone size={20} />,
      label: 'WhatsApp',
      value: '+256751360385',
      link: 'https://wa.me/256751360385'
    },
    {
      icon: <Linkedin size={20} />,
      label: 'LinkedIn',
      value: 'linkedin.com/in/farouk-jjingo-0341b01a5',
      link: 'https://linkedin.com/in/farouk-jjingo-0341b01a5'
    },
    {
      icon: <Globe size={20} />,
      label: 'Website',
      value: 'jjingofarouk.xyz',
      link: 'https://jjingofarouk.xyz'
    }
  ];

  // Comprehensive feature explanations for each menu item
  const systemFeatures = [
    {
      icon: <Home size={20} />,
      title: 'Point of Sale (POS)',
      description: 'Fast and intuitive sales interface with real-time inventory updates. Process transactions quickly with customer management, discounts, and instant receipt generation.',
      capabilities: [
        'Quick product search and barcode scanning',
        'Real-time stock level updates during sales',
        'Customer profile integration',
        'Discounts and promotional pricing',
        'Hold orders for later processing',
        'Instant receipt printing'
      ]
    },
    {
      icon: <CreditCard size={20} />,
      title: 'Transactions History',
      description: 'Complete record of all sales and financial transactions with advanced filtering and search capabilities.',
      capabilities: [
        'View complete sales history',
        'Filter by date, customer, or product',
        'Transaction details and receipts',
        'Refund and return processing',
        'Sales performance analytics'
      ]
    },
    {
      icon: <Package size={20} />,
      title: 'Inventory Management',
      description: 'Comprehensive stock control system with real-time tracking and intelligent alerts.',
      capabilities: [
        'Real-time stock level monitoring',
        'Low stock and expiry alerts',
        'Batch tracking and management',
        'Product categorization',
        'Supplier management',
        'Stock movement history'
      ]
    },
    {
      icon: <FileText size={20} />,
      title: 'Pending Orders',
      description: 'Manage held and pending orders with easy restoration to POS for completion.',
      capabilities: [
        'View all held orders',
        'Restore orders to POS instantly',
        'Order modification before completion',
        'Customer order history',
        'Bulk order processing'
      ]
    },
    {
      icon: <Users size={20} />,
      title: 'Customer Directory',
      description: 'Complete customer relationship management with purchase history and analytics.',
      capabilities: [
        'Customer profile management',
        'Purchase history tracking',
        'Customer loyalty tracking',
        'Contact information storage',
        'Sales pattern analysis'
      ]
    },
    {
      icon: <Truck size={20} />,
      title: 'Supplier Analytics',
      description: 'Monitor supplier performance and manage restocking operations efficiently.',
      capabilities: [
        'Supplier performance metrics',
        'Restock order management',
        'Price comparison analytics',
        'Delivery tracking',
        'Supplier contact management'
      ]
    },
    {
      icon: <BarChart3 size={20} />,
      title: 'Business Analytics & Accounting',
      description: 'Comprehensive financial reporting and business intelligence with expense tracking.',
      capabilities: [
        'Revenue and profit analysis',
        'Expense categorization and tracking',
        'Sales performance dashboards',
        'Financial reporting',
        'Tax calculation and reporting',
        'Business growth analytics'
      ]
    },
    {
      icon: <Users size={20} />,
      title: 'Staff Management',
      description: 'Role-based user access control with permission management for different staff levels.',
      capabilities: [
        'User account management',
        'Role-based permissions',
        'Login activity tracking',
        'Staff performance monitoring',
        'Access level controls'
      ]
    }
  ];

  const technicalFeatures = [
    {
      icon: <Database size={20} />,
      title: 'Local Data Storage',
      description: 'All your business data is stored securely on your local machine. No internet required for daily operations.'
    },
    {
      icon: <RefreshCw size={20} />,
      title: 'Real-time Updates',
      description: 'Instant synchronization across all modules. Stock levels update immediately after sales.'
    },
    {
      icon: <Shield size={20} />,
      title: 'Data Security',
      description: 'Your business data remains private and secure with local database encryption.'
    },
    {
      icon: <Zap size={20} />,
      title: 'Offline Capability',
      description: 'Continue operations without internet connectivity. All core features work offline.'
    }
  ];

  const handleContactClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div className="about-page">
      <motion.div
        className="about-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="about-logo">
          <Info size={48} className="logo-icon" />
        </div>
        <h1 className="about-title">Fraha Pharmacy Management System</h1>
        <p className="about-subtitle">
          Complete Local Pharmacy POS & Management Solution
        </p>
        <div className="version-badge">
          Version {appVersion}
        </div>
        <div className="system-highlight">
          <Database size={16} />
          <span>Fully Offline | Daily Cloud Backups</span>
        </div>
      </motion.div>

      <div className="about-content">
        {/* System Overview */}
        <motion.section
          className="overview-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="section-title">System Overview</h2>
          <div className="overview-grid">
            {technicalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="overview-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="overview-icon">
                  {feature.icon}
                </div>
                <h3 className="overview-title">{feature.title}</h3>
                <p className="overview-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Module Features */}
        <motion.section
          className="features-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="section-title">System Modules & Capabilities</h2>
          <div className="modules-grid">
            {systemFeatures.map((module, index) => (
              <motion.div
                key={index}
                className="module-card"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="module-header">
                  <div className="module-icon">
                    {module.icon}
                  </div>
                  <h3 className="module-title">{module.title}</h3>
                </div>
                <p className="module-description">{module.description}</p>
                <div className="capabilities-list">
                  <h4 className="capabilities-title">Key Features:</h4>
                  <ul>
                    {module.capabilities.map((capability, capIndex) => (
                      <li key={capIndex} className="capability-item">
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>


        {/* Contact Section */}
        <motion.section
          className="contact-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="section-title">Support & Contact</h2>
          <div className="contact-grid">
            {contactInfo.map((contact, index) => (
              <motion.div
                key={index}
                className={`contact-card ${contact.link ? 'clickable' : ''}`}
                whileHover={{ scale: contact.link ? 1.02 : 1 }}
                onClick={() => handleContactClick(contact.link)}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="contact-icon">
                  {contact.icon}
                </div>
                <div className="contact-info">
                  <div className="contact-label">{contact.label}</div>
                  <div className="contact-value">{contact.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Developer Info */}
        <motion.section
          className="developer-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="section-title">Developer Information</h2>
          <div className="developer-card">
            <div className="developer-avatar">
              <User size={32} />
            </div>
            <div className="developer-info">
              <h3 className="developer-name">Dr. Farouk Jjingo</h3>
              <p className="developer-bio">
                Medical doctor, freelance software developer, researcher, and entrepreneur specializing in healthcare technology solutions.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AboutPage;