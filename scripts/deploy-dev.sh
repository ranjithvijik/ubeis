#!/usr/bin/env bash
# Automated dev deployment: install deps, test, deploy CloudFormation, build & sync frontend.
# Backend API is served by App Runner (see scripts/README-apprunner.md).
# Usage: ./scripts/deploy-dev.sh [--skip-tests] [--skip-install]
# Requires: AWS CLI configured (aws sts get-caller-identity)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# Config (override via env)
ENVIRONMENT="${EIS_ENVIRONMENT:-dev}"
UNIVERSITY_NAME="${EIS_UNIVERSITY_NAME:-UniversityOfBaltimore}"
AWS_REGION="${AWS_REGION:-us-east-1}"
STACK_NAME="eis-${ENVIRONMENT}"
SKIP_TESTS=false
SKIP_INSTALL=false

for arg in "$@"; do
  case $arg in
    --skip-tests)   SKIP_TESTS=true ;;
    --skip-install) SKIP_INSTALL=true ;;
    *) echo "Unknown option: $arg"; echo "Usage: $0 [--skip-tests] [--skip-install]"; exit 1 ;;
  esac
done

echo "=============================================="
echo "EIS Automated Dev Deployment"
echo "  Stack: $STACK_NAME"
echo "  Region: $AWS_REGION"
echo "  University: $UNIVERSITY_NAME"
echo "=============================================="

# 1. AWS identity check
echo ""
echo "[1/5] Checking AWS identity..."
if ! aws sts get-caller-identity --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "ERROR: AWS CLI not configured or no permissions. Run: aws configure && aws sts get-caller-identity"
  exit 1
fi
AWS_ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "  Account: $AWS_ACCOUNT_ID"

# 2. Install dependencies (optional skip for CI that already ran npm ci)
if [ "$SKIP_INSTALL" = false ]; then
  echo ""
  echo "[2/5] Installing dependencies..."
  npm ci 2>/dev/null || npm install
else
  echo ""
  echo "[2/5] Skipping install (--skip-install)"
fi

# 3. Tests (optional skip for faster redeploys)
if [ "$SKIP_TESTS" = false ]; then
  echo ""
  echo "[3/5] Running tests..."
  npm test -- --passWithNoTests 2>/dev/null || npm test
  npm run test:integration
else
  echo ""
  echo "[3/5] Skipping tests (--skip-tests)"
fi

# 4. Deploy CloudFormation (Cognito, DynamoDB, S3, SNS only; API is App Runner)
echo ""
echo "[4/5] Deploying CloudFormation stack: $STACK_NAME..."
BUCKET_SUFFIX="$(echo "${UNIVERSITY_NAME}" | tr '[:upper:]' '[:lower:]')"
aws cloudformation deploy \
  --template-file infrastructure/main.yaml \
  --stack-name "$STACK_NAME" \
  --parameter-overrides "Environment=$ENVIRONMENT" "UniversityName=$UNIVERSITY_NAME" "DeploymentsBucketSuffix=$BUCKET_SUFFIX" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$AWS_REGION" \
  --no-fail-on-empty-changeset

# 5. Build and deploy frontend
echo ""
echo "[5/5] Building and deploying frontend..."
if [ -d "frontend" ]; then
  (cd frontend && npm ci 2>/dev/null || npm install) && (cd frontend && npm run build)
  if [ -d "frontend/dist" ]; then
    FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
      --output text \
      --region "$AWS_REGION" 2>/dev/null || echo "")
    CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
      --output text \
      --region "$AWS_REGION" 2>/dev/null || echo "")
    if [ -n "$FRONTEND_BUCKET" ]; then
      aws s3 sync frontend/dist/ "s3://${FRONTEND_BUCKET}/" --region "$AWS_REGION" --delete
      echo "  Frontend synced to s3://${FRONTEND_BUCKET}/"
      if [ -n "$CLOUDFRONT_ID" ]; then
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*" --region "$AWS_REGION" 2>/dev/null || true
        echo "  CloudFront cache invalidated"
      fi
    else
      echo "  Frontend bucket not in stack outputs (stack may need update)"
    fi
  else
    echo "  frontend/dist/ missing after build, skipping sync"
  fi
else
  echo "  frontend/ not found, skipping"
fi

echo ""
echo "=============================================="
echo "Deployment complete."
echo "  Stack: $STACK_NAME"
echo "  Outputs: aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs'"
echo "  API:    App Runner (see scripts/README-apprunner.md)"
echo "  Frontend: S3 + CloudFront (see FrontendBucket in outputs)"
echo "=============================================="
