// src/renderer/src/components/modals/NewCategory.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, Loader } from 'lucide-react';
import axios from 'axios';
import '../../../styles/NewCategory.css';

interface NewCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: () => void;
}

const NewCategory: React.FC<NewCategoryProps> = ({ isOpen, onClose, onCategoryAdded }) => {
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('http://192.168.1.3:3000/api/categories/category', {
        name: categoryName.trim()
      });

      alert('Category created successfully!');
      setCategoryName('');
      onClose();
      
      // Notify parent component to refresh categories list
      if (onCategoryAdded) {
        onCategoryAdded();
      }
    } catch (err: any) {
      console.error('Failed to create category:', err);
      setError(err.response?.data?.message || 'Failed to create category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="new-category-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        >
          <motion.div
            className="new-category-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="new-category-header">
              <h4 className="new-category-title">
                <LayoutGrid className="new-category-icon" size={24} />
                New Category
              </h4>
              <motion.button 
                className="new-category-close-btn" 
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                <X className="new-category-icon" size={24} />
              </motion.button>
            </div>
            
            <div className="new-category-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <form id="saveCategory" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="categoryName" className="form-label">
                    Category Name*
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    required
                    name="name"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter category name"
                    className="form-control"
                    disabled={loading}
                    maxLength={100}
                  />
                  <div className="character-count">
                    {categoryName.length}/100
                  </div>
                </div>
                
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading || !categoryName.trim()}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="spinner" />
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewCategory;