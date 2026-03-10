# 🎓 University of Baltimore - Executive Information System (EIS) MVP

[![AWS](https://img.shields.io/badge/AWS-CloudFormation-orange?logo=amazon-aws)](https://aws.amazon.com/cloudformation/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A serverless **Executive Information System (EIS)** designed for the University of Baltimore, providing real-time dashboards, KPI tracking, and executive alerts for university leadership. Built on AWS using Infrastructure as Code (CloudFormation) with TypeScript Lambda functions.

> **Why EIS over ERP?** Universities and K-12 institutions benefit from implementing an Executive Information System rather than relying solely on ERP processes. EIS provides strategic decision-making capabilities with real-time insights, while ERP focuses on operational transactions. This approach aligns with digital resource bricolage principles for educational institutions (Cui, 2021).

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Detailed Setup](#-detailed-setup)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment](#3-configure-environment)
  - [4. Deploy Infrastructure](#4-deploy-infrastructure)
  - [5. Deploy Lambda Functions](#5-deploy-lambda-functions)
  - [6. Create Admin User](#6-create-admin-user)
  - [7. Seed Sample Data](#7-seed-sample-data)
- [API Reference](#-api-reference)
- [KPI Definitions](#-kpi-definitions)
- [Frontend Dashboard](#-frontend-dashboard)
- [Testing](#-testing)
- [Deployment Environments](#-deployment-environments)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [References](#-references)

---

## ✨ Features

### Executive Dashboard
- 📊 **Real-time KPI visualization** - Enrollment, financial, and academic metrics
- 🔔 **Proactive alerts** - Threshold-based notifications for executives
- 📈 **Trend analysis** - Historical data comparison and forecasting
- 📱 **Responsive design** - Works on desktop, tablet, and mobile

### University KPIs Tracked
| Category | Metrics |
|----------|---------|
| **Enrollment** | Applications, admissions rate, yield rate, retention rate |
| **Financial** | Tuition revenue, budget utilization, cost per student |
| **Academic** | Graduation rate, course completion, GPA distribution |
| **Research** | Grant funding, publications, faculty productivity |
| **Operations** | Facility utilization, IT service uptime, staff ratios |

### Technical Features
- 🔐 **Role-based access control** - Cognito authentication with custom roles
- ⚡ **Serverless architecture** - Auto-scaling, pay-per-use pricing
- 🏗️ **Infrastructure as Code** - Reproducible deployments via CloudFormation
- 📝 **Audit logging** - Complete trail of data access and changes
- 🔄 **Real-time updates** - DynamoDB Streams for live data sync

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNIVERSITY OF BALTIMORE EIS                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Frontend   │────▶│ API Gateway  │────▶│    Lambda Functions      │ │
│  │   (React)    │     │   (REST)     │     │  ┌────────────────────┐  │ │
│  └──────────────┘     └──────────────┘     │  │ dashboard.handler  │  │ │
│         │                    │              │  │ kpis.handler       │  │ │
│         │                    │              │  │ alerts.handler     │  │ │
│         ▼                    ▼              │  │ reports.handler    │  │ │
│  ┌──────────────┐     ┌──────────────┐     │  └────────────────────┘  │ │
│  │   Cognito    │     │  CloudWatch  │     └──────────────────────────┘ │
│  │  User Pool   │     │  Dashboard   │                  │               │
│  └──────────────┘     └──────────────┘                  ▼               │
│                                            ┌──────────────────────────┐ │
│                                            │       DynamoDB           │ │
│                                            │    (Single-Table)        │ │
│                                            └──────────────────────────┘ │
│                                                         │               │
│                              ┌───────────────┬──────────┴───────────┐  │
│                              ▼               ▼                      ▼  │
│                        ┌──────────┐   ┌──────────┐           ┌────────┐│
│                        │    S3    │   │   SNS    │           │ Streams││
│                        │ (Reports)│   │ (Alerts) │           │        ││
│                        └──────────┘   └──────────┘           └────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS Services Used

| Service | Purpose | Estimated Cost (Dev) |
|---------|---------|---------------------|
| **API Gateway** | REST API endpoints | ~$3.50/million requests |
| **Lambda** | Serverless compute | ~$0.20/million invocations |
| **DynamoDB** | NoSQL database | ~$1.25/million writes |
| **Cognito** | Authentication | Free tier (50K MAU) |
| **S3** | Report storage | ~$0.023/GB |
| **SNS** | Alert notifications | ~$0.50/million publishes |
| **CloudWatch** | Monitoring & logs | ~$0.30/GB ingested |

**Estimated Monthly Cost (Dev):** $10-25/month

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 18.x or higher | [Download](https://nodejs.org/) |
| **npm** | 9.x or higher | Included with Node.js |
| **AWS CLI** | 2.x | [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **Git** | 2.x | [Download](https://git-scm.com/) |

### AWS Requirements

- [ ] AWS Account with administrative access
- [ ] AWS CLI configured with credentials
- [ ] IAM permissions for CloudFormation, Lambda, DynamoDB, S3, Cognito, API Gateway, SNS, CloudWatch

### Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check AWS CLI version
aws --version
# Expected: aws-cli/2.x.x

# Verify AWS credentials
aws sts get-caller-identity
# Expected: JSON with Account, UserId, Arn
```

---

## 🚀 Quick Start

For experienced developers who want to get up and running quickly:

```bash
# 1. Clone the repository
git clone https://github.com/university-of-baltimore/uob-eis-mvp.git
cd uob-eis-mvp

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your AWS settings
nano .env

# 5. Deploy everything (infrastructure + code)
npm run deploy:dev

# 6. Create admin user
npm run create-admin

# 7. Seed sample data
npm run seed-data

# 8. Get API endpoint
aws cloudformation describe-stacks \
  --stack-name uob-eis-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

---

## 📖 Detailed Setup

### 1. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/university-of-baltimore/uob-eis-mvp.git

# Or clone via SSH
git clone git@github.com:university-of-baltimore/uob-eis-mvp.git

# Navigate to project directory
cd uob-eis-mvp
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies (if using React dashboard)
cd frontend && npm install && cd ..

# Verify installation
npm list --depth=0
```

**Expected output:**
```
uob-eis-mvp@1.0.0
├── @aws-sdk/client-dynamodb@3.x.x
├── @aws-sdk/client-s3@3.x.x
├── @aws-sdk/client-sns@3.x.x
├── @types/aws-lambda@8.x.x
├── @types/node@18.x.x
├── esbuild@0.x.x
├── jest@29.x.x
├── typescript@5.x.x
└── ...
```

### 3. Configure Environment

#### Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

#### Edit Environment Variables

Open `.env` in your preferred editor and configure:

```bash
# .env - Environment Configuration for UoB EIS MVP

# ============================================
# AWS Configuration
# ============================================
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# ============================================
# Application Configuration
# ============================================
ENVIRONMENT=dev
UNIVERSITY_NAME=UniversityOfBaltimore
APP_NAME=uob-eis

# ============================================
# Stack Names (auto-generated, can override)
# ============================================
STACK_NAME=uob-eis-${ENVIRONMENT}

# ============================================
# Cognito Configuration
# ============================================
ADMIN_EMAIL=admin@ubalt.edu
ADMIN_TEMP_PASSWORD=TempPass123!

# ============================================
# Alert Configuration
# ============================================
ALERT_EMAIL=executives@ubalt.edu
ENROLLMENT_THRESHOLD_LOW=500
RETENTION_THRESHOLD_LOW=0.75
BUDGET_UTILIZATION_HIGH=0.95

# ============================================
# Optional: Frontend Configuration
# ============================================
REACT_APP_API_URL=https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev
REACT_APP_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Configure AWS CLI Profile (Optional)

If using a named profile:

```bash
# Set AWS profile
export AWS_PROFILE=uob-eis-profile

# Or add to .env
AWS_PROFILE=uob-eis-profile
```

### 4. Deploy Infrastructure

#### Option A: Deploy All at Once (Recommended)

```bash
# Deploy complete infrastructure stack
npm run deploy:infra:dev
```

#### Option B: Deploy Step by Step

```bash
# Validate CloudFormation template
aws cloudformation validate-template \
  --template-body file://infrastructure/main.yaml

# Deploy the stack
aws cloudformation deploy \
  --template-file infrastructure/main.yaml \
  --stack-name uob-eis-dev \
  --parameter-overrides \
      Environment=dev \
      UniversityName=UniversityOfBaltimore \
  --capabilities CAPABILITY_NAMED_IAM \
  --tags \
      Application=EIS \
      Environment=dev \
      Owner=IT-Department

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name uob-eis-dev
```

#### Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name uob-eis-dev \
  --query 'Stacks[0].StackStatus'

# Expected: "CREATE_COMPLETE"

# List all outputs
aws cloudformation describe-stacks \
  --stack-name uob-eis-dev \
  --query 'Stacks[0].Outputs'
```

### 5. Deploy Lambda Functions

#### Build TypeScript

```bash
# Compile TypeScript to JavaScript
npm run build

# Output will be in /dist directory
```

#### Package and Deploy Lambdas

```bash
# Package Lambda functions
npm run package

# Deploy Lambda code
npm run deploy:lambdas:dev
```

#### Or Deploy Individual Functions

```bash
# Deploy dashboard handler
aws lambda update-function-code \
  --function-name UniversityOfBaltimore-EIS-Dashboard-dev \
  --zip-file fileb://dist/dashboard.zip

# Deploy KPIs handler
aws lambda update-function-code \
  --function-name UniversityOfBaltimore-EIS-KPIs-dev \
  --zip-file fileb://dist/kpis.zip

# Deploy alerts handler
aws lambda update-function-code \
  --function-name UniversityOfBaltimore-EIS-Alerts-dev \
  --zip-file fileb://dist/alerts.zip
```

### 6. Create Admin User

```bash
# Run the admin creation script
npm run create-admin

# Or manually via AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id $(aws cloudformation describe-stacks \
      --stack-name uob-eis-dev \
      --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
      --output text) \
  --username admin@ubalt.edu \
  --user-attributes \
      Name=email,Value=admin@ubalt.edu \
      Name=custom:role,Value=admin \
      Name=custom:department,Value=IT \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS
```

### 7. Seed Sample Data

```bash
# Seed sample KPI data for testing
npm run seed-data

# This will populate:
# - Sample enrollment KPIs
# - Sample financial metrics
# - Sample academic performance data
# - Sample alerts
```

#### Verify Data

```bash
# Query DynamoDB to verify data
aws dynamodb scan \
  --table-name UniversityOfBaltimore-EIS-Data-dev \
  --max-items 5
```

---

## 📡 API Reference

### Base URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
```

### Authentication

All endpoints require a valid JWT token from Cognito:

```bash
# Get token
TOKEN=$(aws cognito-idp initiate-auth \
  --client-id {client-id} \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=admin@ubalt.edu,PASSWORD=YourPassword123! \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Use token in requests
curl -H "Authorization: Bearer $TOKEN" {endpoint}
```

### Endpoints

#### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Get executive dashboard summary |
| `GET` | `/dashboard?period=monthly` | Get dashboard for specific period |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "enrollment": {
      "total": 5234,
      "change": 2.3,
      "trend": "up"
    },
    "retention": {
      "rate": 0.82,
      "change": 0.5,
      "trend": "up"
    },
    "budget": {
      "utilized": 0.67,
      "remaining": 12500000
    },
    "alerts": {
      "critical": 0,
      "warning": 2,
      "info": 5
    }
  },
  "timestamp": "2026-03-09T15:30:00Z"
}
```

#### KPIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/kpis` | Get all KPIs |
| `GET` | `/kpis?category=enrollment` | Get KPIs by category |
| `GET` | `/kpis/{kpiId}` | Get specific KPI details |
| `POST` | `/kpis` | Create new KPI entry |
| `PUT` | `/kpis/{kpiId}` | Update KPI value |

**Categories:** `enrollment`, `financial`, `academic`, `research`, `operations`

#### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/alerts` | Get all active alerts |
| `GET` | `/alerts?severity=critical` | Filter by severity |
| `POST` | `/alerts/{alertId}/acknowledge` | Acknowledge alert |
| `DELETE` | `/alerts/{alertId}` | Dismiss alert |

**Severity Levels:** `critical`, `warning`, `info`

#### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reports` | List available reports |
| `POST` | `/reports/generate` | Generate new report |
| `GET` | `/reports/{reportId}/download` | Download report file |

---

## 📊 KPI Definitions

### Enrollment KPIs

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Applications** | Count of submitted applications | 8,000/year | < 6,000 |
| **Admission Rate** | Admitted / Applications | 65% | < 50% or > 80% |
| **Yield Rate** | Enrolled / Admitted | 35% | < 25% |
| **Retention Rate** | Returning / Previous Year | 82% | < 75% |
| **Graduation Rate** | Graduated / Cohort Start | 45% (6-year) | < 40% |

### Financial KPIs

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Tuition Revenue** | Sum of tuition payments | $85M/year | < $75M |
| **Budget Utilization** | Spent / Allocated | 95% | > 100% or < 80% |
| **Cost per Student** | Total Costs / Enrollment | $18,000 | > $22,000 |
| **Endowment Growth** | (Current - Previous) / Previous | 7%/year | < 3% |

### Academic KPIs

| KPI | Formula | Target | Alert Threshold |
|-----|---------|--------|-----------------|
| **Course Completion** | Completed / Enrolled | 92% | < 85% |
| **Average GPA** | Sum of GPAs / Students | 3.0 | < 2.7 |
| **Faculty Ratio** | Students / Faculty | 15:1 | > 20:1 |
| **Online Enrollment** | Online / Total | 30% | N/A |

---

## 🖥 Frontend Dashboard

### Start Development Server

```bash
cd frontend
npm start
```

Access at: `http://localhost:3000`

### Build for Production

```bash
cd frontend
npm run build
```

### Deploy to S3/CloudFront

```bash
# Sync build to S3
aws s3 sync frontend/build/ s3://uob-eis-frontend-dev/ --delete

# Invalidate CloudFront cache (if using)
aws cloudfront create-invalidation \
  --distribution-id XXXXXXXXXXXXX \
  --paths "/*"
```

---

## 🧪 Testing

### Run All Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Individual Components

```bash
# Test handlers
npm test -- --testPathPattern=handlers

# Test services
npm test -- --testPathPattern=services

# Test specific file
npm test -- dashboard.handler.test.ts
```

### Expected Coverage

| Component | Target Coverage |
|-----------|-----------------|
| Handlers | > 80% |
| Services | > 85% |
| Utils | > 90% |
| Overall | > 80% |

---

## 🌍 Deployment Environments

| Environment | Stack Name | Purpose |
|-------------|------------|---------|
| **dev** | `uob-eis-dev` | Development & testing |
| **staging** | `uob-eis-staging` | Pre-production validation |
| **prod** | `uob-eis-prod` | Production |

### Deploy to Different Environments

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:prod
```

### Environment-Specific Configuration

Configuration files are in `/infrastructure/parameters/`:

- `dev.json` - Development settings
- `staging.json` - Staging settings
- `prod.json` - Production settings

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CloudFormation Stack Failed

```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name uob-eis-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete failed stack and retry
aws cloudformation delete-stack --stack-name uob-eis-dev
aws cloudformation wait stack-delete-complete --stack-name uob-eis-dev
```

#### 2. Lambda Function Timeout

```bash
# Increase timeout in CloudFormation or via CLI
aws lambda update-function-configuration \
  --function-name UniversityOfBaltimore-EIS-Dashboard-dev \
  --timeout 60
```

#### 3. Cognito Authentication Errors

```bash
# Verify user pool exists
aws cognito-idp describe-user-pool \
  --user-pool-id $(aws cloudformation describe-stacks \
      --stack-name uob-eis-dev \
      --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
      --output text)

# Reset user password
aws cognito-idp admin-set-user-password \
  --user-pool-id {pool-id} \
  --username admin@ubalt.edu \
  --password "NewPassword123!" \
  --permanent
```

#### 4. DynamoDB Access Denied

```bash
# Verify IAM role has correct permissions
aws iam get-role-policy \
  --role-name UniversityOfBaltimore-EIS-Lambda-Role-dev \
  --policy-name EISDynamoDBAccess
```

### Get Help

```bash
# View Lambda logs
aws logs tail /aws/lambda/UniversityOfBaltimore-EIS-Dashboard-dev --follow

# Check API Gateway logs
aws logs tail API-Gateway-Execution-Logs_{api-id}/dev --follow
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation as needed
- Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📚 References

1. Cui, M. (2021). Transition from offline to online through digital resource bricolage in a health crisis: A case study of two primary schools. *Pacific Asia Journal of the Association for Information Systems*.

2. Maryland State Department of Education. (2023). Replacement Educator Information System (REIS) Project Documentation.

3. AWS Well-Architected Framework - Serverless Applications Lens.

---

## 👥 Contact

**University of Baltimore IT Department**

- 📧 Email: it-support@ubalt.edu
- 🌐 Website: https://www.ubalt.edu/it
- 📍 Address: 1420 N. Charles Street, Baltimore, MD 21201

---

<p align="center">
  <strong>Built with ❤️ for the University of Baltimore</strong><br>
  <em>Empowering executive decision-making through data-driven insights</em>
</p>