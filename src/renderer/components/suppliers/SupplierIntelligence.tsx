// src/renderer/src/components/suppliers/SupplierIntelligence.tsx
import React, { useState, useEffect } from 'react';
import { supplierService, SupplierReliability, SupplierContactInfo, PriceTrend } from '../../services/supplierService';
import './SupplierIntelligence.css';

interface SupplierIntelligenceProps {
  onSupplierUpdate: () => void;
}

const SupplierIntelligence: React.FC<SupplierIntelligenceProps> = ({ onSupplierUpdate }) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [reliabilityData, setReliabilityData] = useState<Map<number, SupplierReliability>>(new Map());
  const [contactInfo, setContactInfo] = useState<Map<number, SupplierContactInfo>>(new Map());
  const [priceTrends, setPriceTrends] = useState<Map<number, PriceTrend[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      const supplierList = await supplierService.getSuppliers();
      setSuppliers(supplierList);

      // Load reliability data for all suppliers
            const reliabilityPromises = supplierList.map(supplier => 
              supplierService.getSupplierReliability(supplier.id).catch((): SupplierReliability | null => null)
            );
            
            const reliabilityResults = await Promise.all(reliabilityPromises);
      const reliabilityMap = new Map();
      reliabilityResults.forEach((result, index) => {
        if (result) {
          reliabilityMap.set(supplierList[index].id, result);
        }
      });
      setReliabilityData(reliabilityMap);

    } catch (err: any) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierDetails = async (supplierId: number) => {
    try {
      const [contact, trends] = await Promise.all([
        supplierService.getSupplierContactInfo(supplierId),
        supplierService.getSupplierPriceTrends(supplierId)
      ]);
      
      setContactInfo(prev => new Map(prev).set(supplierId, contact));
      setPriceTrends(prev => new Map(prev).set(supplierId, trends));
    } catch (err: any) {
      console.error(`Failed to load details for supplier ${supplierId}:`, err);
    }
  };

  const handleSupplierSelect = (supplierId: number) => {
    setSelectedSupplier(supplierId);
    if (!contactInfo.has(supplierId) || !priceTrends.has(supplierId)) {
      loadSupplierDetails(supplierId);
    }
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 80) return 'reliability-high';
    if (score >= 60) return 'reliability-medium';
    if (score >= 40) return 'reliability-low';
    return 'reliability-poor';
  };

  const getReliabilityIcon = (score: number) => {
    if (score >= 80) return '⭐';
    if (score >= 60) return '✅';
    if (score >= 40) return '⚠️';
    return '❌';
  };

  const renderSupplierCard = (supplier: any) => {
    const reliability = reliabilityData.get(supplier.id);
    
    return (
      <div 
        key={supplier.id} 
        className={`supplier-intel-card ${selectedSupplier === supplier.id ? 'selected' : ''}`}
        onClick={() => handleSupplierSelect(supplier.id)}
      >
        <div className="supplier-basic-info">
          <h3>{supplier.name}</h3>
          {reliability && (
            <div className={`reliability-badge ${getReliabilityColor(reliability.reliability_score)}`}>
              <span className="reliability-icon">{getReliabilityIcon(reliability.reliability_score)}</span>
              <span className="reliability-score">{reliability.reliability_score}%</span>
              <span className="reliability-text">{reliability.recommendation}</span>
            </div>
          )}
        </div>

        {reliability && (
          <div className="reliability-breakdown">
            <div className="breakdown-stats">
              <div className="breakdown-item">
                <span className="label">Recency</span>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${reliability.score_breakdown.recency}%` }}
                  ></div>
                </div>
                <span className="score">{reliability.score_breakdown.recency}%</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Volume</span>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${reliability.score_breakdown.volume}%` }}
                  ></div>
                </div>
                <span className="score">{reliability.score_breakdown.volume}%</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Variety</span>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${reliability.score_breakdown.variety}%` }}
                  ></div>
                </div>
                <span className="score">{reliability.score_breakdown.variety}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="supplier-metrics">
          <div className="metric">
            <span className="metric-value">{reliability?.key_metrics.total_restocks || 0}</span>
            <span className="metric-label">Total Restocks</span>
          </div>
          <div className="metric">
            <span className="metric-value">{reliability?.key_metrics.unique_products || 0}</span>
            <span className="metric-label">Unique Products</span>
          </div>
          <div className="metric">
            <span className="metric-value">{reliability?.key_metrics.total_units || 0}</span>
            <span className="metric-label">Total Units</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSupplierDetails = () => {
    if (!selectedSupplier) return null;

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    const contact = contactInfo.get(selectedSupplier);
    const trends = priceTrends.get(selectedSupplier);
    const reliability = reliabilityData.get(selectedSupplier);

    if (!supplier) return null;

    return (
      <div className="supplier-details-panel">
        <div className="details-header">
          <h3>{supplier.name} - Detailed Analysis</h3>
          <button 
            className="btn-secondary"
            onClick={() => setSelectedSupplier(null)}
          >
            Close
          </button>
        </div>

        {contact && (
          <div className="contact-section">
            <h4>Contact Information</h4>
            <div className="contact-details">
              {contact.extracted_phones.length > 0 ? (
                <div className="phone-numbers">
                  <strong>Phone Numbers:</strong>
                  {contact.extracted_phones.map((phone, index) => (
                    <div key={index} className="phone-item">
                      <span>{phone}</span>
                      <div className="phone-actions">
                        <a href={contact.suggested_actions.call || '#'} className="btn-call">
                          📞 Call
                        </a>
                        <a 
                          href={contact.suggested_actions.whatsapp || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-whatsapp"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No phone numbers found in supplier name</p>
              )}
            </div>
          </div>
        )}

        {trends && trends.length > 0 && (
          <div className="price-trends-section">
            <h4>Price Trends</h4>
            <div className="trends-grid">
              {trends.slice(0, 5).map(trend => (
                <div key={trend.product_id} className="trend-item">
                  <h5>{trend.product_name}</h5>
                  <div className="trend-stats">
                    <div className="trend-stat">
                      <span>Current Trend:</span>
                      <span className={`trend ${trend.trend}`}>{trend.trend}</span>
                    </div>
                    <div className="trend-stat">
                      <span>Avg Price:</span>
                      <span>UGX {trend.average_price.toLocaleString()}</span>
                    </div>
                    <div className="trend-stat">
                      <span>Price Volatility:</span>
                      <span>UGX {trend.price_volatility.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reliability && (
          <div className="reliability-details">
            <h4>Reliability Analysis</h4>
            <div className="reliability-metrics">
              <div className="metric-detail">
                <span>Days Since Last Order:</span>
                <span>{reliability.key_metrics.days_since_last_order} days</span>
              </div>
              <div className="metric-detail">
                <span>Current Products:</span>
                <span>{reliability.key_metrics.current_products}</span>
              </div>
              <div className="metric-detail">
                <span>Overall Score:</span>
                <span className={`score ${getReliabilityColor(reliability.reliability_score)}`}>
                  {reliability.reliability_score}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="supplier-intelligence loading">Loading supplier intelligence...</div>;
  }

  return (
    <div className="supplier-intelligence">
      <div className="intelligence-header">
        <h2>Supplier Intelligence & Reliability</h2>
        <p>Comprehensive analysis of supplier performance and reliability scores</p>
      </div>

      <div className="intelligence-content">
        <div className="suppliers-list">
          <h3>Suppliers by Reliability</h3>
          <div className="suppliers-grid">
            {suppliers.map(renderSupplierCard)}
          </div>
        </div>

        <div className="supplier-details">
          {renderSupplierDetails()}
        </div>
      </div>
    </div>
  );
};

export default SupplierIntelligence;