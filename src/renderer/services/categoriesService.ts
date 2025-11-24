// src/renderer/src/services/categoriesService.ts
import { withErrorHandling } from './api';

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

class CategoriesService {
  private baseURL: string;

  constructor() {
    this.baseURL = 'http://192.168.1.3:3000/api/categories';
    console.log('🚀 CategoriesService using:', this.baseURL);
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return withErrorHandling(async () => {
      console.log('🔄 Fetching categories from API...');
      const response = await fetch(`${this.baseURL}/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const categories = await response.json();
      console.log(`✅ Loaded ${categories.length} categories from API`);
      return categories;
    }, 'Failed to fetch categories');
  }

  /**
   * Create a new category
   */
  async createCategory(name: string): Promise<{ id: number; name: string }> {
    return withErrorHandling(async () => {
      console.log('🔄 Creating category:', name);

      const response = await fetch(`${this.baseURL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Category created successfully:', result);
      return result;
    }, 'Failed to create category');
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: number, name: string): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      console.log('🔄 Updating category:', categoryId, name);

      const response = await fetch(`${this.baseURL}/category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: categoryId, name }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Category not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Category updated successfully');
      return { success: true };
    }, 'Failed to update category');
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
      console.log('🔄 Deleting category:', categoryId);

      const response = await fetch(`${this.baseURL}/category/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Category not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Category deleted successfully');
      return { success: true };
    }, 'Failed to delete category');
  }

  /**
   * Validate category name
   */
  validateCategoryName(name: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Category name is required');
    }

    if (name.length > 50) {
      errors.push('Category name must be less than 50 characters');
    }

    if (!/^[a-zA-Z0-9\s\-&]+$/.test(name)) {
      errors.push('Category name can only contain letters, numbers, spaces, hyphens, and ampersands');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<Category[]> {
    return withErrorHandling(async () => {
      const allCategories = await this.getCategories();
      const searchQuery = query.toLowerCase().trim();
      
      return allCategories.filter(category =>
        category.name.toLowerCase().includes(searchQuery)
      );
    }, 'Failed to search categories');
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: number): Promise<Category | null> {
    return withErrorHandling(async () => {
      const allCategories = await this.getCategories();
      return allCategories.find(category => category.id === categoryId) || null;
    }, 'Failed to fetch category');
  }

  /**
   * Check if category exists
   */
  async categoryExists(name: string): Promise<boolean> {
    return withErrorHandling(async () => {
      const allCategories = await this.getCategories();
      return allCategories.some(category => 
        category.name.toLowerCase() === name.toLowerCase().trim()
      );
    }, 'Failed to check category existence');
  }

  /**
   * Get categories with product counts
   */
  async getCategoriesWithCounts(): Promise<(Category & { productCount: number })[]> {
    return withErrorHandling(async () => {
      // This would require a more complex SQL query in the backend
      // For now, we'll return categories with placeholder counts
      const categories = await this.getCategories();
      
      // In a real implementation, you'd fetch this from the backend
      // For now, return with zero counts
      return categories.map(category => ({
        ...category,
        productCount: 0 // Placeholder
      }));
    }, 'Failed to fetch categories with counts');
  }
}

// Create and export singleton instance
export const categoriesService = new CategoriesService();
export default categoriesService;