#!/bin/bash
 
# ============================================
# EIS Deployment Script
# ============================================

    set - e
 
# Colors for output
RED ='\033[0;31m'
GREEN ='\033[0;32m'
YELLOW ='\033[1;33m'
NC ='\033[0m' # No Color
 
# Configuration
ENVIRONMENT = ${ 1: -dev }
AWS_REGION = ${ AWS_REGION: -us - east - 1 }
STACK_NAME = "eis-${ENVIRONMENT}"
UNIVERSITY_NAME = "UniversityOfBaltimore"

echo - e "${GREEN}========================================${NC}"
echo - e "${GREEN}EIS Deployment Script${NC}"
echo - e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo - e "${GREEN}========================================${NC}"
 
# Validate environment
if [[! "$ENVIRONMENT" =~ ^ (dev | staging | prod)$]]; then
echo - e "${RED}Error: Invalid environment. Use dev, staging, or prod${NC}"
    exit 1
fi
 
# Production confirmation
if ["$ENVIRONMENT" == "prod"]; then
echo - e "${YELLOW}⚠️  WARNING: You are deploying to PRODUCTION${NC}"
read - p "Type 'deploy' to confirm: " confirm
if ["$confirm" != "deploy"]; then
echo - e "${RED}Deployment cancelled${NC}"
        exit 1
fi
fi
 
# Step 1: Install dependencies
echo - e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
npm ci
 
# Step 2: Run tests
echo - e "\n${YELLOW}Step 2: Running tests...${NC}"
npm test
 
# Step 3: Build application
echo - e "\n${YELLOW}Step 3: Building application...${NC}"
npm run build
 
# Step 4: Package Lambda functions
echo - e "\n${YELLOW}Step 4: Packaging Lambda functions...${NC}"
npm run package
 
# Step 5: Deploy CloudFormation stack
echo - e "\n${YELLOW}Step 5: Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
--template - file infrastructure / main.yaml \
--stack - name "$STACK_NAME" \
--parameter - overrides \
Environment = "$ENVIRONMENT" \
UniversityName = "$UNIVERSITY_NAME" \
--capabilities CAPABILITY_NAMED_IAM \
--region "$AWS_REGION" \
--no - fail - on - empty - changeset
 
# Step 6: Get stack outputs
echo - e "\n${YELLOW}Step 6: Getting stack outputs...${NC}"
API_ENDPOINT = $(aws cloudformation describe - stacks \
    --stack - name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region "$AWS_REGION")

echo - e "${GREEN}API Endpoint: ${API_ENDPOINT}${NC}"
 
# Step 7: Deploy Lambda code
echo - e "\n${YELLOW}Step 7: Deploying Lambda functions...${NC}"
FUNCTIONS = ("Dashboard" "KPIs" "Alerts" "AlertProcessor" "Reports")

for func in "${FUNCTIONS[@]}"; do
    FUNCTION_NAME = "${UNIVERSITY_NAME}-EIS-${func}-${ENVIRONMENT}"
    ZIP_FILE = "dist/lambdas/${func,,}.zip"
    
    if [-f "$ZIP_FILE"]; then
        echo "  Deploying ${func}..."
        aws lambda update - function- code \
--function- name "$FUNCTION_NAME" \
--zip - file "fileb://${ZIP_FILE}" \
--region "$AWS_REGION" \
            > /dev/null
echo - e "  ${GREEN}✓ ${func} deployed${NC}"
    else
echo - e "  ${YELLOW}⚠ ${ZIP_FILE} not found, skipping${NC}"
fi
done
 
# Step 8: Deploy frontend(if exists)
    if [-d "frontend/dist"]; then
echo - e "\n${YELLOW}Step 8: Deploying frontend...${NC}"

FRONTEND_BUCKET = $(aws cloudformation describe - stacks \
    --stack - name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
    --output text \
    --region "$AWS_REGION" 2 > /dev/null || echo "")

if [-n "$FRONTEND_BUCKET"]; then
        aws s3 sync frontend / dist / "s3://${FRONTEND_BUCKET}/" --delete
    echo - e "${GREEN}✓ Frontend deployed to ${FRONTEND_BUCKET}${NC}"
    else
echo - e "${YELLOW}⚠ Frontend bucket not found in stack outputs${NC}"
fi
fi
 
# Step 9: Run smoke tests
echo - e "\n${YELLOW}Step 9: Running smoke tests...${NC}"
API_URL = "$API_ENDPOINT" npm run test: smoke || {
    echo - e "${RED}⚠ Smoke tests failed${NC}"
}
 
# Done
echo - e "\n${GREEN}========================================${NC}"
echo - e "${GREEN}✅ Deployment complete!${NC}"
echo - e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo - e "${GREEN}API: ${API_ENDPOINT}${NC}"
echo - e "${GREEN}========================================${NC}"
