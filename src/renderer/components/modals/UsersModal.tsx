import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users } from 'lucide-react';
import '../../../styles/UsersModal.css';

interface User {
  id: string;
  name: string;
  username: string;
  status: 'Active' | 'Inactive';
}

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsersModal: React.FC<UsersModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Mock data for demonstration; replace with actual API call
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        username: 'johndoe',
        status: 'Active',
      },
      {
        id: '2',
        name: 'Jane Smith',
        username: 'janesmith',
        status: 'Inactive',
      },
    ];
    setUsers(mockUsers);
  }, []);

  const handleEdit = (userId: string) => {
    console.log('Edit user:', userId);
    alert(`Editing user with ID: ${userId}`);
  };

  const handleDelete = (userId: string) => {
    console.log('Delete user:', userId);
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    alert(`Deleted user with ID: ${userId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="users-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        >
          <motion.div
            className="users-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="users-modal-header">
              <h4 className="users-modal-title">
                <Users className="users-modal-icon" size={24} />
                Users
              </h4>
              <button className="users-modal-close-btn" onClick={onClose}>
                <X className="users-modal-icon" size={24} />
              </button>
            </div>
            <div className="users-modal-body">
              <table className="users-table">
                <thead>
                  <tr className="table-header">
                    <th>Name</th>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="table-row">
                        <td>{user.name}</td>
                        <td>{user.username}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              user.status === 'Active' ? 'status-active' : 'status-inactive'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="action-cell">
                          <motion.button
                            className="action-btn edit-btn"
                            onClick={() => handleEdit(user.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(user.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Delete
                          </motion.button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="no-data">
                        No users available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UsersModal;