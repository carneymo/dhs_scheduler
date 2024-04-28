const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

AWSMock.setSDKInstance(AWS);

const { handler } = require("../index");

// Mock SNS
AWSMock.mock("SNS", "publish", (params, callback) => {
  console.log("SNS publish mock called", params);
  callback(null, { MessageId: "fake-message-id" });
});

// Testing the Lambda handler
test("Test appointment availability check", async () => {
  const event = {};
  const response = await handler(event);
  expect(response).toEqual({ status: "Done" });
  AWSMock.restore("SNS");
});
