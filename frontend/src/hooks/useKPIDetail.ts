import { useQuery } from '@tanstack/react-query';
import { kpiService } from '../services/kpi.service';
import type { KPI } from '../types';

export const useKPIDetail = (kpiId: string) => {
  return useQuery<KPI | null>({
    queryKey: ['kpi-detail', kpiId],
    enabled: !!kpiId,
    queryFn: () => kpiService.getKPIById(kpiId),
  });
};

