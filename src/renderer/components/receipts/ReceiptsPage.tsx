// src/renderer/src/components/receipts/ReceiptsPage.tsx
import React from 'react';

const ReceiptsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Receipts</h1>
        <div className="page-actions">
          <button className="btn btn-secondary">
            Print All
          </button>
          <button className="btn btn-primary">
            Generate Receipt
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Receipt Management</h2>
            <p className="card-description">
              View and manage transaction receipts. Print or reprint receipts 
              for your customers as needed.
            </p>
          </div>
          
          <div className="card-body">
            <div className="filters">
              <div className="filter-group">
                <label>Date Range</label>
                <select className="form-select">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Status</label>
                <select className="form-select">
                  <option>All Receipts</option>
                  <option>Printed</option>
                  <option>Not Printed</option>
                </select>
              </div>
            </div>
            
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
              <h3 className="empty-state-title">No Receipts Found</h3>
              <p className="empty-state-description">
                Receipts will appear here after transactions are completed. 
                You can also generate custom receipts.
              </p>
              <button className="btn btn-primary">
                Generate Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsPage;