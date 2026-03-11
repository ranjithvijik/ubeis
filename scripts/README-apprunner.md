# App Runner backend (ubeis-backend-dev)

## Connection: Frontend (CloudFront) ↔ Backend (App Runner)

| Layer | Resource | URL / ID |
|-------|----------|----------|
| **Frontend** | CloudFront | `d2j0wdkaazlq7r.cloudfront.net` |
| | Distribution ID | `E3NBZURCNEN74D` |
| | ARN | `arn:aws:cloudfront::535002849180:distribution/E3NBZURCNEN74D` |
| **Backend** | App Runner | `https://p2ecdhgpp3.us-east-1.awsapprunner.com` |
| | Service | `ubeis-backend-dev` (Running) |

The frontend is built with `VITE_API_BASE_URL=https://p2ecdhgpp3.us-east-1.awsapprunner.com`, so the app in the browser calls the App Runner API directly. CORS on the backend allows the CloudFront origin.

---

## Service URL

- **Base URL:** `https://p2ecdhgpp3.us-east-1.awsapprunner.com`
- **Health:** `GET https://p2ecdhgpp3.us-east-1.awsapprunner.com/health`
- **Service ARN:** `arn:aws:apprunner:us-east-1:535002849180:service/ubeis-backend-dev/65858ca4f20c4774ba2e8479204431ad`

## IAM roles

| Role | Purpose |
|------|--------|
| `ubeis-apprunner-ecr-access` | App Runner pulls the container image from ECR (trust: `build.apprunner.amazonaws.com`). |
| `ubeis-apprunner-instance-role` | Container runtime access to DynamoDB and SNS (trust: `tasks.apprunner.amazonaws.com`). |

Policy files: `apprunner-ecr-access-*.json`, `apprunner-instance-role-*.json`, `apprunner-instance-policy.json`.

## Environment (set on service)

- `DYNAMODB_TABLE` = `UniversityOfBaltimore-EIS-Data-dev`
- `SNS_ALERTS_TOPIC` = `arn:aws:sns:us-east-1:535002849180:UniversityOfBaltimore-EIS-Alerts-dev`
- `AWS_REGION` = `us-east-1`
- `ENVIRONMENT` = `dev`
- `LOG_LEVEL` = `INFO`
- `NODE_ENV` = `production`

## Deploy new image

1. Build and push to ECR (from repo root):
   ```bash
   docker build -t ubeis-backend-dev .
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 535002849180.dkr.ecr.us-east-1.amazonaws.com
   docker tag ubeis-backend-dev:latest 535002849180.dkr.ecr.us-east-1.amazonaws.com/ubeis-backend-dev:latest
   docker push 535002849180.dkr.ecr.us-east-1.amazonaws.com/ubeis-backend-dev:latest
   ```
2. In App Runner console, start a new deployment for `ubeis-backend-dev`, or:
   ```bash
   aws apprunner start-deployment --service-arn "arn:aws:apprunner:us-east-1:535002849180:service/ubeis-backend-dev/65858ca4f20c4774ba2e8479204431ad" --region us-east-1
   ```

## Recreate service (optional)

```bash
aws apprunner create-service --cli-input-json file://scripts/apprunner-create-service.json --region us-east-1
```
