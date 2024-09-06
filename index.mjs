import https from "https";
import AWS from "aws-sdk";

AWS.config.update({ region: process.env.REGION });
const sns = new AWS.SNS();

/**
 * SAMPLE CALL AND RESPONSE
 * 
 * CALL:
 * https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=5003
 * 
 * RESPONSE:
    {
      "availableSlots": [
          {
              "locationId": 5003,
              "startTimestamp": "2024-10-02T09:00",
              "endTimestamp": "2024-10-02T09:10",
              "active": true,
              "duration": 10,
              "remoteInd": false
          }
      ],
      "lastPublishedDate": "2024-12-31T15:10:00"
    }
 */

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
    const res = event.test
      ? event
      : await checkAvailability();
    // Log our result so we can see in CloudWatch
    console.log(res);
    // Logging the result above will abbreviate the available slots
    console.log(res.data.availableSlots);

    // If availble, let's notify via SNS
    if (res.available) {
      // Filter out slots that don't match our criteria
      let filtered = filterAvailable(res.data["availableSlots"]);
      if (filtered.length > 0) {
        await notifyAvailability(filtered, event.test);
      }
      else {
        console.log("No available slots based on filters.");
      }
    }
    return { statusCode: 200, body: "success" };
  } catch (error) {
    console.error("Error checking availability:", error);
    return { statusCode: 500, body: "failure" };
  }
};

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

/**
 * Notify Availability
 * Will publish the new slot information to SNS.
 * @returns Promise
 */
async function notifyAvailability(availableDateTimes, testEvent) {
  let slots = [];
  availableDateTimes.forEach(element => {
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
  if ("LOCAL" in process.env || testEvent) {
    console.log("--Simulating sending SNS message for Local--");
    console.log(params);
  } else {
    return sns.publish(params).promise();
  }
}


/**
 * Filtered Available
 * 
 * Built with a specific filter in mind (parsing out dates)
 * but could be extended to include other filters, such as times, locations, etc.
 * @param {*} available 
 */
function filterAvailable(available) {
  if ("FILTERED" in process.env && process.env.FILTERED == "true") {
    if ("DATE_ENDING" in process.env) {
      available = filterDateEnding(available, process.env.DATE_ENDING);
    }
  }
  return available;
}

/**
 * Filter by Date
 * 
 * The date is defined by the environmental variable DATE_ENDING.
 * Eg. 
 * IF:    a slot has 2024-10-01 and the DATE_ENDING is set to 2024-10-30 
 * THEN:  the slot will be returned.
 * 
 * Eg2.
 * IF:    a slot has 2024-10-01 and the DATE_ENDING is set to 2024-09-30
 * THEN:  the slot will not be returned.
 * @param {} available 
 * @param {*} date_ending 
 * @returns 
 */
function filterDateEnding(available, date_ending) {
  let filtered = [];
  available.forEach(element => {
    let fDateEnding = new Date(date_ending);
    let fDateAvailable = new Date(element.startTimestamp);
    if (fDateEnding >= fDateAvailable) {
      filtered.push(element);
    }
  });
  return filtered;
}