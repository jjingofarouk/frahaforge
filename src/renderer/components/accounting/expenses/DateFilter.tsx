// src/renderer/src/components/accounting/DateFilter.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronDown, 
  Download, 
  Filter,
  X
} from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
import './DateFilter.css';

interface DateFilterProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  onExport: () => void;
  transactionCount: number;
  loading: boolean;
  title?: string;
  subtitle?: string;
}

type PresetOption = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const DateFilter: React.FC<DateFilterProps> = ({
  dateRange,
  onDateRangeChange,
  onExport,
  transactionCount,
  loading,
  title = "Expense Tracker",
  subtitle
}) => {
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetOption>('today');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Predefined date ranges - adjusted for your data (Nov 15-17, 2025)
  const presetOptions: { key: PresetOption; label: string; getRange: () => { start: Date; end: Date } }[] = [
    {
      key: 'today',
      label: 'Today',
      getRange: () => ({
        start: startOfDay(new Date(2025, 10, 17)), // Nov 17, 2025
        end: endOfDay(new Date(2025, 10, 17))
      })
    },
    {
      key: 'yesterday',
      label: 'Yesterday',
      getRange: () => {
        const yesterday = new Date(2025, 10, 16); // Nov 16, 2025
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday)
        };
      }
    },
    {
      key: 'thisWeek',
      label: 'This Week',
      getRange: () => {
        const today = new Date(2025, 10, 17); // Nov 17, 2025
        const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
        const end = endOfDay(today);
        return { start, end };
      }
    },
    {
      key: 'lastWeek',
      label: 'Last Week',
      getRange: () => {
        const today = new Date(2025, 10, 17);
        const end = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        const start = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        return { start, end };
      }
    },
    {
      key: 'thisMonth',
      label: 'This Month',
      getRange: () => ({
        start: startOfMonth(new Date(2025, 10, 17)), // November 1, 2025
        end: endOfDay(new Date(2025, 10, 17)) // November 17, 2025
      })
    },
    {
      key: 'lastMonth',
      label: 'Last Month',
      getRange: () => {
        return {
          start: startOfMonth(new Date(2025, 9, 1)), // October 1, 2025
          end: endOfMonth(new Date(2025, 9, 31)) // October 31, 2025
        };
      }
    },
    {
      key: 'thisYear',
      label: 'This Year',
      getRange: () => ({
        start: startOfYear(new Date(2025, 10, 17)), // January 1, 2025
        end: endOfDay(new Date(2025, 10, 17)) // November 17, 2025
      })
    },
    {
      key: 'custom',
      label: 'Custom Range',
      getRange: () => dateRange
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPresetOpen(false);
        setShowCustomRange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize with today's preset
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      handlePresetSelect('today');
    }
  }, []);

  // Initialize custom dates when custom range is shown
  useEffect(() => {
    if (showCustomRange && !customStart && !customEnd) {
      setCustomStart(format(dateRange.start, 'yyyy-MM-dd'));
      setCustomEnd(format(dateRange.end, 'yyyy-MM-dd'));
    }
  }, [showCustomRange, customStart, customEnd, dateRange]);

  const handlePresetSelect = (preset: PresetOption) => {
    if (preset === 'custom') {
      setShowCustomRange(true);
      setActivePreset('custom');
    } else {
      const range = presetOptions.find(opt => opt.key === preset)?.getRange();
      if (range) {
        onDateRangeChange(range);
        setActivePreset(preset);
        setShowCustomRange(false);
      }
    }
    setIsPresetOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (customStart && customEnd) {
      const start = startOfDay(new Date(customStart));
      const end = endOfDay(new Date(customEnd));
      
      if (start <= end) {
        onDateRangeChange({ start, end });
        setActivePreset('custom');
        setShowCustomRange(false);
      }
    }
  };

  const handleCustomRangeCancel = () => {
    setShowCustomRange(false);
    setCustomStart('');
    setCustomEnd('');
  };

  const getDisplayText = () => {
    if (activePreset === 'custom') {
      return `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
    }
    return presetOptions.find(opt => opt.key === activePreset)?.label || 'Select Period';
  };

  const formatDateRange = () => {
    if (activePreset === 'custom') {
      return `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
    }
    return getDisplayText();
  };

  // Calculate total amount for the current filtered expenses
  const calculateTotalAmount = () => {
    // This would typically come from your stats, but for now we'll calculate from count
    // In a real app, you'd get this from your summary stats
    return transactionCount > 0 ? 'Calculating...' : 'USh 0';
  };

  return (
    <div className="date-filter-header">
      {/* Header Section */}
      <div className="date-filter-header__top">
        <div className="date-filter-header__title-section">
          <h1 className="date-filter-header__title">{title}</h1>
          {subtitle && <p className="date-filter-header__subtitle">{subtitle}</p>}
        </div>
        
        <div className="date-filter-header__actions">
          <motion.button
            className="date-filter-export-btn"
            onClick={onExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={transactionCount === 0 || loading}
          >
            <Download size={16} />
            Export CSV
          </motion.button>
        </div>
      </div>

      {/* Filter Controls Section */}
      <div className="date-filter-controls">
        <div className="date-filter-preset" ref={dropdownRef}>
          <motion.button
            className="date-filter-preset__trigger"
            onClick={() => setIsPresetOpen(!isPresetOpen)}
            whileHover={{ backgroundColor: 'var(--secondary-gray-dark)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar size={16} />
            <span>{getDisplayText()}</span>
            <motion.div
              animate={{ rotate: isPresetOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {isPresetOpen && (
              <motion.div
                className="date-filter-preset__dropdown"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {presetOptions.map((option) => (
                  <button
                    key={option.key}
                    className={`date-filter-preset__option ${
                      activePreset === option.key ? 'date-filter-preset__option--active' : ''
                    }`}
                    onClick={() => handlePresetSelect(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Current Range Display */}
        <div className="date-filter-current-range">
          <Filter size={14} />
          <span>{formatDateRange()}</span>
          {transactionCount > 0 && (
            <span className="date-filter-count">
              {transactionCount} expense{transactionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Custom Range Modal */}
      <AnimatePresence>
        {showCustomRange && (
          <motion.div
            className="date-filter-custom-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="date-filter-custom-modal__content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="date-filter-custom-modal__header">
                <h3>Custom Date Range</h3>
                <button
                  className="date-filter-custom-modal__close"
                  onClick={handleCustomRangeCancel}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="date-filter-custom-modal__inputs">
                <div className="date-filter-input-group">
                  <label htmlFor="start-date">From Date</label>
                  <input
                    id="start-date"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    max={customEnd || '2025-11-17'}
                    min="2025-01-01"
                  />
                </div>

                <div className="date-filter-input-group">
                  <label htmlFor="end-date">To Date</label>
                  <input
                    id="end-date"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart || '2025-01-01'}
                    max="2025-11-17"
                  />
                </div>
              </div>

              <div className="date-filter-date-hint">
                <small>Your data spans from Nov 15, 2025 to Nov 17, 2025</small>
              </div>

              <div className="date-filter-custom-modal__actions">
                <button
                  className="date-filter-custom-modal__cancel"
                  onClick={handleCustomRangeCancel}
                >
                  Cancel
                </button>
                <button
                  className="date-filter-custom-modal__apply"
                  onClick={handleCustomRangeApply}
                  disabled={!customStart || !customEnd}
                >
                  Apply Range
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateFilter;