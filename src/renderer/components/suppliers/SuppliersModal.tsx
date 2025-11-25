import React, { useState, useEffect } from 'react';
import { X, Edit2, Plus, Building2, Search, Trash2 } from 'lucide-react';
import { suppliersService, Supplier } from '../../services/supplierService';
import './SuppliersModal.css';

interface SuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuppliersModal: React.FC<SuppliersModalProps> = ({ isOpen, onClose }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchQuery, suppliers]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await suppliersService.getSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditName(supplier.name);
  };

  const handleSave = async (supplierId: number) => {
    if (!editName.trim()) return;
    
    try {
      await suppliersService.updateSupplier(supplierId, editName);
      await loadSuppliers(); // Reload to get updated data
      setEditingId(null);
      setEditName('');
    } catch (error) {
      console.error('Failed to update supplier:', error);
      alert('Failed to update supplier. Please try again.');
    }
  };

  const handleAdd = async () => {
    if (!newSupplierName.trim()) return;
    
    try {
      await suppliersService.createSupplier(newSupplierName);
      await loadSuppliers();
      setNewSupplierName('');
    } catch (error) {
      console.error('Failed to create supplier:', error);
      alert('Failed to create supplier. Please try again.');
    }
  };

  const handleDelete = async (supplierId: number, supplierName: string) => {
    if (!confirm(`Are you sure you want to delete "${supplierName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await suppliersService.deleteSupplier(supplierId);
      await loadSuppliers();
    } catch (error: any) {
      console.error('Failed to delete supplier:', error);
      alert(error.message || 'Failed to delete supplier. They may have associated products or restock history.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (!isOpen) return null;

  return (
    <div className="suppliers-modal">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>Manage Suppliers</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Add Supplier */}
        <div className="add-section">
          <input
            type="text"
            placeholder="Enter new supplier name..."
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            className="supplier-input"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd} 
            className="add-btn"
            disabled={!newSupplierName.trim()}
          >
            <Plus size={16} />
            Add Supplier
          </button>
        </div>

        {/* Suppliers List */}
        <div className="suppliers-list">
          {loading ? (
            <div className="loading">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="empty">
              {searchQuery ? 'No suppliers found matching your search' : 'No suppliers found'}
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="supplier-item">
                {editingId === supplier.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="supplier-input"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleSave(supplier.id)}
                      onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                    />
                    <button 
                      onClick={() => handleSave(supplier.id)} 
                      className="save-btn"
                      disabled={!editName.trim() || editName === supplier.name}
                    >
                      Save
                    </button>
                    <button onClick={cancelEdit} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="view-mode">
                    <Building2 size={16} className="supplier-icon" />
                    <span className="supplier-name">{supplier.name}</span>
                    <div className="actions">
                      <button 
                        onClick={() => handleEdit(supplier)} 
                        className="edit-btn"
                        title="Edit supplier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(supplier.id, supplier.name)} 
                        className="delete-btn"
                        title="Delete supplier"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="modal-footer">
          <span className="supplier-count">
            {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>
      </div>
    </div>
  );
};