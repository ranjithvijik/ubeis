# 🎓 University of Baltimore - Executive Information System (UBalt EIS) MVP

[![AWS](https://img.shields.io/badge/AWS-CloudFormation-orange?logo=amazon-aws)](https://aws.amazon.com/cloudformation/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A **Executive Information System (EIS)** for the University of Baltimore, providing real-time dashboards, KPI tracking, executive alerts, and drill-down from KPIs to transaction-level records. Backend runs on **AWS App Runner** (Docker/Express); frontend is hosted on **CloudFront + S3**; data and auth use **CloudFormation** (Cognito, DynamoDB, SNS, S3 Reports bucket).

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
  - [5. Backend (App Runner) & Frontend](#5-backend-app-runner--frontend)
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

**Related docs:** [scripts/README-apprunner.md](scripts/README-apprunner.md) (App Runner backend, ECR, URLs) · [TESTING.md](TESTING.md) (unit, integration, coverage)

**One-command dev deploy:** `npm run deploy:dev:auto` (tests, CloudFormation, frontend build + S3 sync). Backend API is deployed separately via Docker + ECR + App Runner (see [scripts/README-apprunner.md](scripts/README-apprunner.md)).

---

## ✨ Features

### Executive Dashboard
- 📊 **Modern KPI indicators** - Status pill, delta chip, sparkline trend, rank-in-category, contribution %, and YoY change at a glance
- 🔎 **Drill-down to transactions** - View transaction-level records behind aggregated KPI values
- 🧭 **Visual insight gallery** - Tableau-style gallery with gauges, combo charts, donuts, word cloud, underperformance strips, and momentum panels, all with clickable drill-down
- 🔔 **Proactive alerts** - Threshold-based notifications for executives
- 📈 **Trend analysis** - Historical comparisons (KPI history rows in DynamoDB)
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
- 🔐 **Role-based access control** - Cognito authentication with custom roles (admin, president, provost, CFO, dean, chair, viewer)
- 🧱 **Container backend** - Express API on AWS App Runner (Docker + ECR)
- 🏗️ **Infrastructure as Code** - Reproducible deployments via CloudFormation
- 🗂️ **Single-table DynamoDB design** - KPIs, alerts, history, reports, and KPI transactions
- 🧾 **Reports API (CXO-grade)** - Generate **styled PDF/Excel** reports (color-coded status, zebra striping, insights sheet highlighting underperformers) and download via S3 presigned URLs
- 🧪 **Realistic seeded data** - KPIs, history, and transactions backfilled from UB docs into DynamoDB (including drill-down)
- 🏷️ **UBalt branding** - Official UBalt logo and content from `ubalt.edu` in header/sidebar

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNIVERSITY OF BALTIMORE EIS                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                    ┌────────────────────────────────┐ │
│  │   Frontend   │───────────────────▶│  App Runner (Express API)      │ │
│  │   (React)    │  HTTPS + CORS      │  /dashboard, /kpis, /alerts,   │ │
│  │             │                    │  /reports, /kpis/:id/transactions│ │
│  │ CloudFront   │                    │  Image: ECR (Docker)            │ │
│  │   + S3       │                    └────────────────────────────────┘ │
│  └──────────────┘                                    │                  │
│         │                                             ▼                  │
│         │                                    ┌──────────────────────────┐│
│  ┌──────┴──────┐                             │       DynamoDB           ││
│  │   Cognito   │                             │    (Single-Table)        ││
│  │  User Pool  │                             └──────────────────────────┘│
│  └─────────────┘                                        │                │
│                                 ┌───────────────────────┼───────────────┐│
│                                 ▼                       ▼                │
│                          ┌──────────┐            ┌──────────┐           │
│                          │ S3       │            │   SNS    │           │
│                          │(Frontend,│            │ (Alerts) │           │
│                          │ Reports) │            └──────────┘           │
│                          └──────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### AWS Services Used

| Service | Purpose | Estimated Cost (Dev) |
|---------|---------|---------------------|
| **App Runner** | Backend API (container) | ~$0.064/vCPU-hr + $0.007/GB-hr |
| **ECR** | Docker image registry | ~$0.10/GB/month |
| **CloudFront** | Frontend CDN | ~$0.085/GB + requests |
| **S3** | Frontend static + reports | ~$0.023/GB |
| **DynamoDB** | NoSQL database | ~$1.25/million writes |
| **Cognito** | Authentication | Free tier (50K MAU) |
| **SNS** | Alert notifications | ~$0.50/million publishes |

**Live URLs (dev):** Frontend: `https://d2j0wdkaazlq7r.cloudfront.net` · API: `https://p2ecdhgpp3.us-east-1.awsapprunner.com`

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
- [ ] IAM permissions for CloudFormation, App Runner, ECR, DynamoDB, S3, Cognito, SNS

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
git clone https://github.com/ranjithvijik/ubeis.git
cd eis

# 2. Install dependencies
npm install
cd frontend && npm install && cd ..

# 3. (Optional) Copy environment template if present, or create .env with AWS/API settings for local runs

# 4. Run tests (or use automated deploy which runs them)
npm test
npm run test:integration

# 5. Deploy infra + frontend (install, test, CloudFormation, frontend build + S3 sync)
npm run deploy:dev:auto

# Backend: build Docker image, push to ECR, deploy App Runner (see scripts/README-apprunner.md)

# 6. Create admin user
npm run create-admin

# 7. Seed sample data
npm run seed-data

# 8. Get stack outputs (API endpoint, User Pool ID, etc.)
aws cloudformation describe-stacks --stack-name eis-dev --query 'Stacks[0].Outputs'
```

For backend (Docker, ECR, App Runner) see **[scripts/README-apprunner.md](scripts/README-apprunner.md)**.

---

## 📖 Detailed Setup

### 1. Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/ranjithvijik/ubeis.git

# Or clone via SSH
git clone git@github.com:ranjithvijik/ubeis.git

# Navigate to project directory
cd eis
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
# .env - Environment Configuration for UBalt EIS MVP

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
APP_NAME=ubalt-eis

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
# Frontend (Vite) - set in frontend/.env.production for build
VITE_API_BASE_URL=https://p2ecdhgpp3.us-east-1.awsapprunner.com
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
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

#### Option A: Deploy Infra + Frontend (Recommended)

```bash
# Run tests, deploy CloudFormation (Cognito, DynamoDB, S3, SNS), build and sync frontend
npm run deploy:dev:auto
```

Or deploy only CloudFormation:

```bash
npm run deploy:dev
```

#### Option B: Deploy Step by Step

```bash
# Validate CloudFormation template
aws cloudformation validate-template \
  --template-body file://infrastructure/main.yaml

# Deploy the stack (no Lambda; backend is App Runner)
aws cloudformation deploy \
  --template-file infrastructure/main.yaml \
  --stack-name eis-dev \
  --parameter-overrides \
      Environment=dev \
      UniversityName=UniversityOfBaltimore \
      DeploymentsBucketSuffix=universityofbaltimore \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name eis-dev
```

#### Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name eis-dev \
  --query 'Stacks[0].StackStatus'

# Expected: "CREATE_COMPLETE"

# List all outputs
aws cloudformation describe-stacks \
  --stack-name eis-dev \
  --query 'Stacks[0].Outputs'
```

### 5. Backend (App Runner) & Frontend

The **backend API** runs on AWS App Runner (Express in Docker). To deploy or update it:

```bash
# From repo root: build image, push to ECR, trigger App Runner deployment
docker build -t ubeis-backend-dev .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 535002849180.dkr.ecr.us-east-1.amazonaws.com
docker tag ubeis-backend-dev:latest 535002849180.dkr.ecr.us-east-1.amazonaws.com/ubeis-backend-dev:latest
docker push 535002849180.dkr.ecr.us-east-1.amazonaws.com/ubeis-backend-dev:latest
aws apprunner start-deployment --service-arn "arn:aws:apprunner:us-east-1:535002849180:service/ubeis-backend-dev/65858ca4f20c4774ba2e8479204431ad" --region us-east-1
```

**Frontend** is built with `VITE_API_BASE_URL=https://p2ecdhgpp3.us-east-1.awsapprunner.com`. After `npm run deploy:dev:auto`, sync `frontend/dist/` to the S3 bucket that backs your CloudFront distribution (see stack output `FrontendBucket`).

Full details: **[scripts/README-apprunner.md](scripts/README-apprunner.md)**.

### 6. Create Admin User

```bash
# Run the admin creation script
npm run create-admin

# Or manually via AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id $(aws cloudformation describe-stacks \
      --stack-name eis-dev \
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
# Seed document-shaped KPI data for testing (KPIs + history + alerts + KPI transactions)
npm run seed-data

# This will populate:
# - KPIs (including document-derived enrollment series)
# - KPI history rows (SK: HISTORY#...)
# - KPI transaction rows for drill-down (SK: TX#...)
# - Active alerts
```

#### Verify Data

```bash
# Query DynamoDB to verify data (table name from stack parameters)
aws dynamodb scan \
  --table-name UniversityOfBaltimore-EIS-Data-dev \
  --max-items 5
```

---

## 📡 API Reference

### Base URL (dev)

```
https://p2ecdhgpp3.us-east-1.awsapprunner.com
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
| `POST` | `/reports` | Generate new report (CSV content for MVP) |
| `GET` | `/reports/{reportId}/download` | Download report file |

#### KPI Transactions (Drill-down)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/kpis/{kpiId}/transactions` | List transaction-level records for a KPI |

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

The React dashboard uses **Vite** and **AWS Amplify Auth (Cognito)**.

### Start Development Server

```bash
cd frontend
npm install
npm run dev
```

Access at: `http://localhost:5173` (Vite default).

### Build for Production

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`. Run `npm run preview` to preview the production build locally.

### Key Screens

- **Dashboard** – KPI tiles with modern status/trend visuals, a rich visual gallery (gauges, combo charts, donut, word cloud, underperformance and momentum views), and drill-down links to KPI detail pages and transactions.
- **KPIs** – Searchable list of all KPIs (by name or category), each tile clickable to a detailed view.
- **Alerts** – Active alerts with acknowledge/resolve actions (admin-only for resolve).
- **Reports** – Generate and download CXO-style PDF/Excel reports with color-coded insights highlighting underperforming metrics.
- **Settings** – User profile (name, email, role, department, college), theme toggle, and notification preferences.
- **Admin (via `admin@ubalt.edu`)** – Admin user (created via `npm run create-admin`) can provision KPIs and is the primary owner for future account-provisioning features.

### Frontend Tests

```bash
cd frontend
npm test          # Vitest unit/component tests
npm run test:e2e # Playwright E2E (requires app or CI setup)
```

### Deploy to S3/CloudFront

After building, sync to the bucket that backs your CloudFront distribution (e.g. from stack output `FrontendBucket`):

```bash
aws s3 sync frontend/dist/ s3://535002849180-universityofbaltimore-eis-frontend-dev/ --delete --region us-east-1

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E3NBZURCNEN74D --paths "/*"
```

---

## 🧪 Testing

See **[TESTING.md](TESTING.md)** for full details.

### Backend (Jest)

```bash
# Unit tests
npm test

# With coverage report and thresholds
npm run test:coverage

# Integration tests (pattern: **/*.integration.test.ts; passes with no tests)
npm run test:integration
```

### Test Individual Components

```bash
# Test services
npm test -- --testPathPattern=services

# Test specific file
npm test -- kpi.service.test.ts
```

### Coverage

Coverage thresholds are set in `jest.config.js`. Current suite includes KPI service tests; add more tests and raise thresholds as needed.

---

## 🌍 Deployment Environments

| Environment | Stack Name | Purpose |
|-------------|------------|---------|
| **dev** | `eis-dev` | Development & testing |
| **staging** | `eis-staging` | Pre-production validation |
| **prod** | `eis-prod` | Production |

### Deploy to Different Environments

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:prod
```

Each command deploys the CloudFormation stack (Cognito, DynamoDB, S3, SNS). Backend is deployed via Docker + ECR + App Runner; see **[scripts/README-apprunner.md](scripts/README-apprunner.md)**.

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CloudFormation Stack Failed

```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name eis-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete failed stack and retry
aws cloudformation delete-stack --stack-name eis-dev
aws cloudformation wait stack-delete-complete --stack-name eis-dev
```

#### 2. App Runner / API Errors

```bash
# Check backend health
curl https://p2ecdhgpp3.us-east-1.awsapprunner.com/health

# View App Runner service status
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:us-east-1:535002849180:service/ubeis-backend-dev/65858ca4f20c4774ba2e8479204431ad" \
  --region us-east-1 --query 'Service.Status'
```

#### 3. Cognito Authentication Errors

```bash
# Verify user pool exists
aws cognito-idp describe-user-pool \
  --user-pool-id $(aws cloudformation describe-stacks \
      --stack-name eis-dev \
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

Ensure the App Runner instance role (`ubeis-apprunner-instance-role`) has DynamoDB and SNS permissions. Policy is in `scripts/apprunner-instance-policy.json`.

### Get Help

```bash
# App Runner logs (service name from scripts/README-apprunner.md)
aws logs tail /aws/apprunner/ubeis-backend-dev/65858ca4f20c4774ba2e8479204431ad/application --follow --region us-east-1
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