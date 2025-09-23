const axios = require("axios");

const OLA_MAPS_API_KEY = process.env.OLA_MAPS_API_KEY;

if (!OLA_MAPS_API_KEY) {
  console.error("OLA_MAPS_API_KEY is not set in environment variables");
}

exports.reverseGeocode = async (lat, lng) => {
  try {
    if (!lat || !lng) {
      console.error("Latitude and longitude are required");
      return "Invalid coordinates";
    }

    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${OLA_MAPS_API_KEY}`;
    console.log("Calling Ola Maps API with URL:", url.replace(OLA_MAPS_API_KEY, 'REDACTED'));

    const response = await axios.get(url);
    const data = response.data;
    console.log("Ola Maps API response:", JSON.stringify(data, null, 2));

    if (!data || !data.results || data.results.length === 0) {
      console.error("No address found in the response");
      return "Location not available";
    }

    // Return the formatted address from the first result
    const address = data.results[0]?.formatted_address;
    return address || "Location not available";

  } catch (err) {
    console.error("Ola Maps reverse geocode failed:", {
      message: err.message,
      url: err.config?.url?.replace(OLA_MAPS_API_KEY, 'REDACTED'),
      status: err.response?.status,
      data: err.response?.data
    });
    return "Location not available";
  }
};