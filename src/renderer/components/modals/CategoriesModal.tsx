// src/renderer/src/components/modals/CategoriesModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Edit, Trash2, Loader } from 'lucide-react';
import axios from 'axios';
import '../../../styles/CategoriesModal.css';

interface Category {
  id: number; // Remove the duplicate 'id' property
  name: string;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://192.168.1.3:3000/api/categories/all');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return;

    try {
      setLoading(true);
      await axios.put('http://192.168.1.3:3000/api/categories/category', {
        id: editingCategory.id,
        name: editName
      });

      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? { ...cat, name: editName } : cat
      ));
      
      setEditingCategory(null);
      setEditName('');
      alert('Category updated successfully!');
    } catch (err) {
      console.error('Failed to update category:', err);
      setError('Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://192.168.1.3:3000/api/categories/category/${categoryId}`);
      
      // Update local state
      setCategories(prev => prev.filter(category => category.id !== categoryId));
      alert('Category deleted successfully!');
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="categories-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="categories-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="categories-modal-header">
              <h4 className="categories-modal-title">
                <LayoutGrid className="categories-modal-icon" size={24} />
                Product Categories ({categories.length})
              </h4>
              <motion.button 
                className="categories-modal-close-btn" 
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="categories-modal-icon" size={24} />
              </motion.button>
            </div>
            
            <div className="categories-modal-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="loading-state">
                  <Loader size={32} className="spinner" />
                  <p>Loading categories...</p>
                </div>
              ) : (
                <table className="categories-table">
                  <thead>
                    <tr className="table-header">
                      <th>ID</th>
                      <th>Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <tr key={category.id} className="table-row">
                          <td className="category-id">{category.id}</td>
                          <td className="category-name">
                            {editingCategory?.id === category.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="edit-input"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit();
                                }}
                              />
                            ) : (
                              category.name
                            )}
                          </td>
                          <td className="action-cell">
                            {editingCategory?.id === category.id ? (
                              <div className="edit-actions">
                                <motion.button
                                  className="action-btn save-btn"
                                  onClick={handleSaveEdit}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={loading}
                                >
                                  Save
                                </motion.button>
                                <motion.button
                                  className="action-btn cancel-btn"
                                  onClick={cancelEdit}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={loading}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            ) : (
                              <div className="action-buttons">
                                <motion.button
                                  className="action-btn edit-btn"
                                  onClick={() => handleEdit(category)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={loading}
                                >
                                  <Edit size={16} />
                                  Edit
                                </motion.button>
                                <motion.button
                                  className="action-btn delete-btn"
                                  onClick={() => handleDelete(category.id)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={loading}
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </motion.button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="no-data">
                          No categories found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoriesModal;