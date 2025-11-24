// src/renderer/src/components/pos/PosCart/PosCartBadge.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users } from 'lucide-react';

interface PosCartBadgeProps {
  cartItemsCount: number;
  customerName?: string;
  isCartEmpty: boolean;
}

export const PosCartBadge: React.FC<PosCartBadgeProps> = ({
  cartItemsCount,
  customerName,
  isCartEmpty
}) => {
  if (isCartEmpty) return null;

  const getBadgeContent = () => {
    if (customerName) {
      return {
        text: customerName.split(' ')[0],
        icon: <Users size={12} />,
        color: 'bg-blue-500'
      };
    }

    return {
      text: `${cartItemsCount}`,
      icon: <ShoppingBag size={12} />,
      color: 'bg-purple-500'
    };
  };

  const badge = getBadgeContent();

  return (
    <motion.div
      className={`pos-cart-badge ${badge.color}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {badge.icon}
      <span className="badge-text">{badge.text}</span>
    </motion.div>
  );
};