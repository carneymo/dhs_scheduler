const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

AWSMock.setSDKInstance(AWS); // Ensure that aws-sdk-mock uses the same AWS instance
require("dotenv").config();

// Mock SNS
AWSMock.mock("SNS", "publish", (params, callback) => {
  console.log("SNS publish mock called", params);
  callback(null, { MessageId: "fake-message-id" });
});

const sns = new AWS.SNS();

test("SNS publish test", async () => {
  const params = {
    Message: "Testing SNS Mock",
    TopicArn: "arn:aws:sns:your-topic-arn",
  };

  const result = await sns.publish(params).promise();
  expect(result).toEqual({ MessageId: "fake-message-id" });
});

afterAll(() => {
  AWSMock.restore("SNS");
});
