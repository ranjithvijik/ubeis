// ============================================
// Create Admin User Script
// ============================================
 
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
 
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
 
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ubalt.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TempPassword123!';
 
const createAdminUser = async (): Promise<void> => {
  if (!USER_POOL_ID) {
    throw new Error('COGNITO_USER_POOL_ID environment variable is required');
  }
 
  console.log(`Creating admin user: ${ADMIN_EMAIL}`);
 
  // Create user
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: ADMIN_EMAIL,
      UserAttributes: [
        { Name: 'email', Value: ADMIN_EMAIL },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:role', Value: 'admin' },
      ],
      MessageAction: 'SUPPRESS',
    })
  );
 
  // Set permanent password
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: ADMIN_EMAIL,
      Password: ADMIN_PASSWORD,
      Permanent: true,
    })
  );
 
  console.log('Admin user created successfully!');
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('\nPlease change the password after first login.');
};
 
createAdminUser().catch((error) => {
  console.error('Error creating admin user:', error);
  process.exit(1);
});

APPENDIX: FILE STRUCTURE
uob-eis-mvp/
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
│
├── src/
│   ├── types/
│   │   ├── index.ts
│   │   └── api.types.ts
│   │
│   ├── constants/
│   │   ├── kpi.constants.ts
│   │   ├── alert.constants.ts
│   │   ├── role.constants.ts
│   │   └── api.constants.ts
│   │
│   ├── utils/
│   │   ├── response.util.ts
│   │   ├── logger.util.ts
│   │   ├── validation.util.ts
│   │   ├── date.util.ts
│   │   └── dynamodb.util.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── repositories/
│   │   ├── base.repository.ts
│   │   ├── kpi.repository.ts
│   │   ├── alert.repository.ts
│   │   └── user.repository.ts
│   │
│   ├── services/
│   │   ├── dashboard.service.ts
│   │   ├── kpi.service.ts
│   │   ├── alert.service.ts
│   │   └── notification.service.ts
│   │
│   └── handlers/
│       ├── dashboard.handler.ts
│       ├── kpis.handler.ts
│       ├── alerts.handler.ts
│       ├── alert-processor.handler.ts
│       └── reports.handler.ts
│
├── infrastructure/
│   └── main.yaml
│
├── tests/
│   ├── setup.ts
│   └── unit/
│       ├── services/
│       │   └── kpi.service.test.ts
│       └── handlers/
│           └── dashboard.handler.test.ts
│
└── scripts/
    ├── seed-data.ts
    └── create-admin-user.ts

University of Baltimore
Executive Information System (EIS)
Supplementary Source Code Documentation
Part 2: Frontend, Deployment & Testing

Table of Contents

1. Frontend Project Configuration
2. React Components - Core
3. React Components - Dashboard
4. React Components - KPIs
5. React Components - Alerts
6. React Components - Common
7. React Hooks
8. React Services
9. React Context & State
10. Frontend Styles
11. GitHub Actions CI/CD Workflows
12. Deployment Scripts
13. Automated Test Scripts - Unit Tests
14. Automated Test Scripts - Integration Tests
15. Automated Test Scripts - E2E Tests (Playwright)
16. Test Utilities & Fixtures

1. FRONTEND PROJECT CONFIGURATION
