import type { ResourcesConfig } from 'aws-amplify';

// Basic AWS Amplify configuration for Cognito auth.
// Values are taken from the CloudFormation outputs / dev stack.
export const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_qxP60gQiH',
      userPoolClientId: '4qvb8d02u8dvurj3vkmch17b0h',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
};

