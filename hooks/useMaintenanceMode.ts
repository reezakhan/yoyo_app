
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkMaintenanceMode = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get('/configurations/app_maintenance_mode');

      if (response.success) {
        setIsMaintenanceMode(response.data.value === true);
      } else {
        setError(response.error || 'Failed to check maintenance mode');
        setIsMaintenanceMode(false);
      }
    } catch (err: any) {
      console.error('Maintenance mode check error:', err);
      setError(err.message || 'Failed to check maintenance mode');
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  return {
    isMaintenanceMode,
    loading,
    error,
    refetch: checkMaintenanceMode,
  };
}
