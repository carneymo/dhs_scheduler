const https = require("https");
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-west-2" });
const sns = new AWS.SNS();
require("dotenv").config();

// DHS Website Scheduler - Specific to Denver availability
const dhs_denver_endpoint =
  process.env.API_URL + "/slot-availability?locationId=6940";

exports.handler = async (event) => {
  let available = await checkAvailability();
  if (available) {
    await notifyAvailability();
  }
  return { status: "Done" };
};

function checkAvailability() {
  return new Promise((resolve, reject) => {
    https
      .get(dhs_denver_endpoint, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          parsed_data = JSON.parse(data);
          let available =
            parsed_data["availableSlots"] &&
            parsed_data["availableSlots"].length != 0;
          resolve(available);
        });
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}

// Used for testing only
function notifyUnavailability() {
  const params = {
    Message: "No appointments available.",
    TopicArn: process.env.SNS_TOPIC_ARN,
  };
  console.log("Publishing to SNS with params:", params);
  return sns.publish(params).promise();
}

function notifyAvailability() {
  const params = {
    Message: "An appointment slot is available!",
    TopicArn: process.env.SNS_TOPIC_ARN,
  };
  console.log("Publishing to SNS with params:", params);
  return sns.publish(params).promise();
}
