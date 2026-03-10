// ============================================
// KPI Service Unit Tests
// ============================================
 
import { KPIService } from '../../../src/services/kpi.service';
import { KPIRepository } from '../../../src/repositories/kpi.repository';
import { NotFoundError } from '../../../src/middleware/error.middleware';
 
jest.mock('../../../src/repositories/kpi.repository');
 
describe('KPIService', () => {
  let kpiService: KPIService;
  let mockRepository: jest.Mocked<KPIRepository>;
 
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new KPIRepository() as jest.Mocked<KPIRepository>;
    kpiService = new KPIService();
    (kpiService as any).kpiRepository = mockRepository;
  });
 
  describe('getKPIById', () => {
    it('should return KPI when found', async () => {
      const mockKPI = {
        kpiId: 'kpi-001',
        name: 'Total Enrollment',
        category: 'enrollment',
        currentValue: 5234,
        status: 'on_target',
      };
 
      mockRepository.getById.mockResolvedValue(mockKPI as any);
      mockRepository.getHistory.mockResolvedValue({ items: [], nextToken: undefined });
 
      const result = await kpiService.getKPIById('kpi-001');
 
      expect(result.kpiId).toBe('kpi-001');
      expect(mockRepository.getById).toHaveBeenCalledWith('kpi-001');
    });
 
    it('should throw NotFoundError when KPI not found', async () => {
      mockRepository.getById.mockResolvedValue(null);
 
      await expect(kpiService.getKPIById('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
 
  describe('getKPIs', () => {
    it('should return all KPIs when no category specified', async () => {
      const mockKPIs = [
        { kpiId: '1', name: 'Enrollment', category: 'enrollment' },
        { kpiId: '2', name: 'Revenue', category: 'financial' },
      ];
 
      mockRepository.getAll.mockResolvedValue({ items: mockKPIs as any[], nextToken: undefined });
 
      const result = await kpiService.getKPIs();
 
      expect(result.items).toHaveLength(2);
      expect(mockRepository.getAll).toHaveBeenCalled();
    });
 
    it('should filter KPIs by category', async () => {
      const mockKPIs = [{ kpiId: '1', name: 'Enrollment', category: 'enrollment' }];
 
      mockRepository.getByCategory.mockResolvedValue({ items: mockKPIs as any[], nextToken: undefined });
 
      const result = await kpiService.getKPIs('enrollment');
 
      expect(result.items).toHaveLength(1);
      expect(mockRepository.getByCategory).toHaveBeenCalledWith('enrollment', undefined);
    });
  });
 
  describe('createKPI', () => {
    it('should create a new KPI', async () => {
      const createRequest = {
        name: 'New KPI',
        category: 'enrollment' as const,
        targetValue: 5000,
        unit: 'students',
        threshold: { critical: 4000, warning: 4500 },
        thresholdType: 'min' as const,
        dataSource: 'banner',
      };
 
      const mockCreated = { kpiId: 'new-kpi', ...createRequest };
      mockRepository.create.mockResolvedValue(mockCreated as any);
 
      const result = await kpiService.createKPI(createRequest, 'user-001');
 
      expect(result.kpiId).toBe('new-kpi');
      expect(mockRepository.create).toHaveBeenCalledWith(createRequest, 'user-001');
    });
  });
});
