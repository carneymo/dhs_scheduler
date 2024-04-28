import https from "https";

// We want denver appointments!
const dhs_denver_endpoint =
  "https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=6940";

// This had slots when I last checked 28 April 2024, useful for testing
const dhs_texas_endpoint =
  "https://ttp.cbp.dhs.gov/schedulerapi/slot-availability?locationId=5003";

export const handler = async (event) => {
  try {
    const available = await checkAvailability();
    if (available) {
      console.log("Slots available");
      return { statusCode: 200, body: "success" };
    } else {
      console.log("No slots available");
      return { statusCode: 200, body: "failure" };
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    return { statusCode: 500, body: "failure" };
  }
};

function checkAvailability() {
  return new Promise((resolve, reject) => {
    https
      .get(dhs_denver_endpoint, (res) => {
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
