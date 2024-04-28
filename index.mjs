import https from "https";
import AWS from "aws-sdk";

AWS.config.update({ region: "us-east-2" });
const sns = new AWS.SNS();

// We want denver appointments!
const dhs_denver_endpoint = {
  name: "DHS Denver Location",
  url: "https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=6940",
};

// This had slots when I last checked 28 April 2024, useful for testing
const dhs_texas_endpoint = {
  name: "DHS Texas Location",
  url: "https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=5003",
};

// "Production" is Denver endpoint
let current_endpoint = dhs_denver_endpoint;

// "Testing" is the Texas endpoint (cause I know it has slots)
// let current_endpoint = dhs_texas_endpoint;

export const handler = async (event) => {
  try {
    const available = await checkAvailability();
    if (available) {
      console.log("Slots available");
      await notifyAvailability();
    } else {
      console.log("No slots available");
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    return { statusCode: 500, body: "failure" };
  }
};

async function notifyAvailability() {
  const params = {
    Message:
      "An appointment slot is available! We checked this endpoint: " +
      current_endpoint.name,
    TopicArn: process.env.SNS_TOPIC_ARN,
  };
  console.log("Publishing to SNS with params:", params);
  return sns.publish(params).promise();
}

function checkAvailability() {
  return new Promise((resolve, reject) => {
    https
      .get(current_endpoint.url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const parsed_data = JSON.parse(data);
          const available =
            parsed_data["availableSlots"] &&
            parsed_data["availableSlots"].length > 0;
          resolve(available);
        });
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}
