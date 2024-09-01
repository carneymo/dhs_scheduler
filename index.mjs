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

/**
 * Main handler
 * Will check availability then notify if available.
 * @param {*} event
 * @returns
 */
export const handler = async (event) => {
  try {
    const res = await checkAvailability();
    // Log our result so we can see in CloudWatch
    console.log(res);

    // If availble, let's notify via SNS
    if (res.available) {
      await notifyAvailability(res);
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    return { statusCode: 500, body: "failure" };
  }
};

/**
 * Notify Availability
 * Will publish the new slot information to SNS.
 * @returns Promise
 */
async function notifyAvailability(res) {
  let slots = [];
  res.data["availableSlots"].forEach(element => {
    let [date, time] = element.startTimestamp.split('T');
    /**
     * Location: current_endpoint.name
     * Date: date
     * Start Time: time
     * Duration: element.duration 
     */
    slots.push(
      "Location: " + current_endpoint.name + "\n" +
      "Date: " + date + "\n" +
      "Start Time: " + time + "\n" +
      "Duration: " + element.duration + "\n"
    );
  });
  const params = {
    Message:
      "An appointment slot is available! We checked the following endpoint: \n" +
      current_endpoint.name + "\n" + current_endpoint.url + "\n\n" +
      "--- APPOINTMENT SLOTS AVAILABLE --- \n\n" +
      slots.join('\n'),
    TopicArn: process.env.SNS_TOPIC_ARN,
  };
  console.log("Publishing to SNS with params:", params);
  return sns.publish(params).promise();
}

/**
 * Checks Availability
 * Will do a fetch at the DHS website to see available slots for
 * appointments at the specific location.
 * @returns Promise
 */
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
          resolve({
            available: available,
            endpoint: current_endpoint,
            data: parsed_data,
          });
        });
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}
