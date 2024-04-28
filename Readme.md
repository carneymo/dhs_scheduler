# DHS Website Scheduler

The DHS Website Scheduler is a Node.js application deployed on AWS Lambda. It checks for available appointment slots at a specified location (Denver in this case) and sends notifications via AWS SNS when slots become available or are unavailable.

## Features

- **Availability Checking**: Periodically checks for appointment slots using a designated endpoint.
- **Notifications**: Sends notifications via AWS SNS when appointment slots are available or not.

## Prerequisites

- AWS Account
- Node.js installed locally (for testing and deployment)
- AWS CLI installed and configured

## Setup

### Environment Variables

Create a `.env` file in the project root and populate it with the following variables:

```plaintext
API_URL=https://api.example.com  # Base URL for the API
SNS_TOPIC_ARN=arn:aws:sns:region:account-id:topicname  # SNS Topic ARN
```

### AWS Configuration

Ensure that the AWS credentials used have permissions for the following services:

- AWS Lambda
- AWS SNS

## Local Development

### Installing Dependencies

Install the necessary Node.js packages:

```bash
npm install
```

### Running Tests

Ensure your functions are working as expected by running:

```bash
npm test
```

## Deployment

Deploy the application to AWS Lambda using the AWS CLI:

```bash
aws lambda update-function-code --function-name YourFunctionName --zip-file fileb://your-function.zip
```

### Setting up AWS Lambda

1. Create a new Lambda function via the AWS Management Console.
2. Set the runtime to Node.js.
3. Adjust the function's timeout and memory settings as required.
4. Set the environment variables as per the `.env` file contents.

### Setting up AWS EventBridge (CloudWatch Events)

1. Create a new rule that triggers on a schedule (e.g., every 15 minutes).
2. Set the target as your Lambda function.

### Setting up AWS SNS

1. Create a new SNS topic.
2. Subscribe to the topic using your preferred notification channel (e.g., email or SMS).

## Monitoring

Monitor the application using AWS CloudWatch for logs and metrics.

## Troubleshooting

Refer to AWS CloudWatch logs if the function does not behave as expected. Check the error messages and stack traces for clues.
