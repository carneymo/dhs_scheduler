const AWSMock = require("aws-sdk-mock");
const { handler } = require("../index");
require("dotenv").config();

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
});

// After each test
afterEach(() => {
  AWSMock.restore("SNS");
  jest.resetModules(); // this ensures that each test has a clean slate
});

// After tests
afterAll(() => {
  AWSMock.restore("SNS");
});
