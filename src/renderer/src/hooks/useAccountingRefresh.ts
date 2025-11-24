// src/renderer/src/hooks/useAccountingRefresh.ts
import { useEffect } from 'react';
import { accountsService } from '../../services/accountsService';
import { useAccountingStore } from '../stores/accountingStore';

export const useAccountingRefresh = () => {
  const { refreshData, forceReRender } = useAccountingStore();

  useEffect(() => {
    // Subscribe to global refresh events
    const unsubscribe = accountsService.onRefresh(() => {
      console.log('Global refresh triggered - marking data as stale');
      refreshData();
      forceReRender();
    });

    return unsubscribe;
  }, [refreshData, forceReRender]);

  const triggerRefresh = async () => {
    await accountsService.forceRefreshAll();
  };

  return {
    triggerRefresh
  };
};