// ============================================
// Dashboard Handler Unit Tests
// ============================================
 
import { handler } from '../../../src/handlers/dashboard.handler';
import { DashboardService } from '../../../src/services/dashboard.service';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
 
jest.mock('../../../src/services/dashboard.service');
 
describe('Dashboard Handler', () => {
  let mockEvent: Partial<APIGatewayProxyEvent>;
  let mockContext: Partial<Context>;
 
  beforeEach(() => {
    jest.clearAllMocks();
 
    mockEvent = {
      httpMethod: 'GET',
      path: '/dashboard',
      queryStringParameters: { period: 'monthly' },
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-id',
            email: 'test@ubalt.edu',
            'custom:role': 'president',
          },
        },
      } as any,
    };
 
    mockContext = {
      awsRequestId: 'test-request-id',
    };
  });
 
  it('should return dashboard data for authenticated user', async () => {
    const mockDashboardData = {
      summary: {
        totalKPIs: 10,
        kpisOnTarget: 7,
        kpisAtRisk: 2,
        kpisBelowTarget: 1,
        criticalAlerts: 0,
        warningAlerts: 2,
        infoAlerts: 5,
      },
      kpis: [],
      alerts: [],
      generatedAt: new Date().toISOString(),
    };
 
    (DashboardService.prototype.getDashboard as jest.Mock).mockResolvedValue(mockDashboardData);
 
    const response = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);
 
    expect(response.statusCode).toBe(200);
 
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.summary).toBeDefined();
  });
 
  it('should return 401 for unauthenticated request', async () => {
    mockEvent.requestContext = {} as any;
 
    const response = await handler(mockEvent as APIGatewayProxyEvent, mockContext as Context);
 
    expect(response.statusCode).toBe(401);
  });
});
