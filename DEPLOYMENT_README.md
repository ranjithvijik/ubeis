# EIS Dev Deployment Guide & Readiness Checklist

## Automated dev deployment (recommended)

From the project root, with **AWS CLI configured** (`aws sts get-caller-identity` works):

```bash
npm run deploy:dev:auto
```

This runs **`scripts/deploy-dev.sh`**, which:

1. Verifies AWS identity and resolves the deploy bucket name
2. Installs dependencies (`npm ci` or `npm install`)
3. Runs unit and integration tests
4. Builds and packages Lambdas (`npm run package`)
5. Creates the S3 deploy bucket if it doesn’t exist, then uploads `dist/lambdas/*.zip`
6. Deploys the CloudFormation stack (`eis-dev`)

**Options:**

- `--skip-tests` – skip tests (faster redeploys)
- `--skip-install` – skip `npm install` (e.g. CI already ran it)

**Environment overrides (optional):**

- `EIS_ENVIRONMENT` – default `dev`
- `EIS_UNIVERSITY_NAME` – default `UniversityOfBaltimore`
- `AWS_REGION` – default `us-east-1`

**CI/CD:** The same flow is implemented in **`.github/workflows/deploy-dev.yml`**, which runs on push to `main` or `develop`. Configure repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`. Optionally: `FRONTEND_BUCKET_DEV`, `CLOUDFRONT_DIST_DEV` for frontend deploy.

---

## Pre-deployment checklist (manual flow)

### 1. Environment
- [ ] **Node.js 18+** – `node -v`
- [ ] **npm** – `npm install` (run from project root; ensure sufficient disk space)
- [ ] **AWS CLI** – configured with credentials and region: `aws sts get-caller-identity`

### 2. Build & package
- [ ] **Install dependencies** – `npm install`
- [ ] **Backend build** – `npm run build` (TypeScript compiles to `dist/`)
- [ ] **Package Lambdas** – `npm run package` (creates zips in `dist/lambdas/`; requires `archiver` in devDependencies)

### 3. Tests (recommended)
- [ ] **Unit tests** – `npm test`
- [ ] **Integration tests** – `npm run test:integration` (passes with no integration tests; add `**/*.integration.test.ts` for real integration tests)
- [ ] **Coverage** – `npm run test:coverage` (optional; enforces minimum coverage thresholds)
- [ ] **Lint** – `npm run lint`

### 4. Infrastructure template
- [ ] **Template valid** – `aws cloudformation validate-template --template-body file://infrastructure/main.yaml`
- [ ] **S3 deployment bucket** – Create and use a bucket for Lambda code (see below). Template expects:  
  `{AccountId}-{UniversityName}-eis-deployments`  
  Example: `123456789012-UniversityOfBaltimore-eis-deployments`

### 5. First-time deploy steps

1. **Create S3 deployment bucket** (if it doesn’t exist):
   ```bash
   AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   aws s3 mb s3://${AWS_ACCOUNT_ID}-UniversityOfBaltimore-eis-deployments --region us-east-1
   ```

2. **Build and package Lambdas**:
   ```bash
   npm run package
   ```

3. **Upload Lambda zips to S3**:
   ```bash
   AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   aws s3 cp dist/lambdas/ s3://${AWS_ACCOUNT_ID}-UniversityOfBaltimore-eis-deployments/lambdas/ --recursive
   ```

4. **Deploy CloudFormation stack**:
   ```bash
   npm run deploy:dev
   ```
   Or manually:
   ```bash
   aws cloudformation deploy \
     --template-file infrastructure/main.yaml \
     --stack-name eis-dev \
     --parameter-overrides Environment=dev UniversityName=UniversityOfBaltimore \
     --capabilities CAPABILITY_NAMED_IAM
   ```

5. **Configure API Gateway**  
   The template creates the REST API and Cognito authorizer but does **not** define routes (methods/integrations). To have working endpoints you must add:
   - Resources and methods (e.g. `GET /dashboard`, `GET /kpis`, `GET /kpis/{id}`, etc.)
   - Lambda integrations for each method  
   Use the API Gateway console or a separate template/script to add these, or extend `infrastructure/main.yaml` with the required `AWS::ApiGateway::Resource`, `AWS::ApiGateway::Method`, and `AWS::ApiGateway::Integration` resources.

6. **Create admin user** (after stack is up):
   ```bash
   npm run create-admin
   ```
   (Requires `UserPoolId` from stack outputs; script may need to read it from CloudFormation or env.)

7. **Seed data** (optional):
   ```bash
   npm run seed-data
   ```

---

## Known gaps (fix before or right after first deploy)

| Item | Status | Notes |
|------|--------|--------|
| **API Gateway routes** | Not in template | Add methods + integrations for `/dashboard`, `/kpis`, `/alerts`, etc., or use API Gateway console. |
| **Reports Lambda** | Packaged but not in template | `reports.handler` is in `package-lambdas.js` but there is no `ReportsFunction` or reports route in `main.yaml`. Add if reports API is required. |
| **.env / env config** | Not in repo | Create `.env` from `.env.example` (if present) for local/script use; Lambdas get env from CloudFormation. |
| **Disk space** | User-dependent | If `npm install` fails with ENOSPC, free disk space and retry. |

---

## Quick validation commands

```bash
# Validate CloudFormation template
aws cloudformation validate-template --template-body file://infrastructure/main.yaml

# After deploy: list stack outputs
aws cloudformation describe-stacks --stack-name eis-dev --query 'Stacks[0].Outputs'
```

---

## Summary

- **Code**: Backend and frontend structure are in place; build and package work once deps are installed and disk space is available.
- **Infrastructure**: `infrastructure/main.yaml` is valid CloudFormation; stack deploys Cognito, DynamoDB, S3, SNS, Lambdas (with code from S3), and API Gateway (without routes). Add S3 upload and API Gateway configuration as above for a complete dev deploy.
