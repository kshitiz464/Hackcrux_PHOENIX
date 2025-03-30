const admin = require("firebase-admin");
// const functions = require("firebase-functions");
admin.initializeApp({
  databaseURL:
    "https://iothack-e3e50-default-rtdb.asia-southeast1.firebasedatabase.app/",
});
const {onValueWritten} =
  require("firebase-functions/v2/database");
// const {region} = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const axios = require("axios");

const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast";
// const LOCATION = "Ajmer";
const WEATHER_DATA_EXPIRY_SECONDS = 7200;
// Change this to take Location from
// Users/{UID}/FieldList/{FieldID}/FieldInfo/Data/.location
const isExpired = (timestamp) => {
  const now = new Date().getTime();
  const then = timestamp.toDate().getTime();
  return (now - then) > WEATHER_DATA_EXPIRY_SECONDS * 1000;
};
const getLocationData = async (db, location) => {
  const cachedWeatherRef = db.collection("cachedWeatherData").doc(location);
  const docSnapshot = await cachedWeatherRef.get();

  if (docSnapshot.exists) {
    const cachedData = docSnapshot.data();
    if (cachedData.timestamp && !isExpired(cachedData.timestamp)) {
      console.log(`Returning cached data for ${location}`);
      return cachedData;
    } else {
      console.log(`Cached data for ${location} is expired.`);
      return null;
    }
  } else {
    console.log(`No cached data found for ${location}`);
    return null;
  }
};
const getWeatherDataForField = async (db, location, API_KEY) => {
  const cachedData = await getLocationData(db, location);
  if (cachedData) {
    return cachedData;
  }

  // const API_KEY = process.env.WEATHER_API_KEY;
  const bUrlCurrent = `${WEATHER_API_URL}?`;
  const loc = `q=${location}&`;
  const appIdCurrent = `appid=${API_KEY}&`;
  const uP = `units=metric`;
  const url = bUrlCurrent + loc + appIdCurrent + uP;
  console.log("Fetching weather for URL:", url);

  try {
    const weatherResponse = await axios.get(url);
    const weatherData = weatherResponse.data;
    const {lat, lon} = weatherData.coord;
    const bUrl = `${FORECAST_API_URL}?`;
    const coor = `lat=${lat}&lon=${lon}&appid=${API_KEY}&`;
    const uP = `units=metric`;
    const forecastUrl = bUrl + coor + uP;
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;
    let rain = 0;
    for (let i = 0; i < Math.min(2, forecastData.list.length); i++) {
      const forecast = forecastData.list[i];
      if (forecast.rain && forecast.rain["3h"]) {
        rain = forecast.rain["3h"];
        break;
      }
    }
    const data = {
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windspeed: weatherData.wind.speed,
      rain: rain,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      location: location, // Store location in cached data
    };
    const cachedWeatherRef =
      db.collection("cachedWeatherData").doc(location);
    await cachedWeatherRef.set(data);
    console.log(`Weather data fetched and cached for ${location}`);
    return data;
  } catch (error) {
    console.error(`Error fetching weather for ${location}:`, error);
    return null;
  }
};

exports.fetchWeatherData = onSchedule(
    "every 2 hours",
    async () => {
      try {
        console.log("FetchWeatherData function started!");
        const db = admin.firestore();
        const uniqueLocations = new Set();
        // Get all users
        const usersSnapshot = await db.collection("users").get();

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const fieldsSnapshot = await db.collection("users")
              .doc(userId).collection("fields").get();

          for (const fieldDoc of fieldsSnapshot.docs) {
            const fieldInfoRef = db.collection("users")
                .doc(userId).collection("fields")
                .doc(fieldDoc.id).collection("FieldInfo").doc("Data");
            const fieldInfoSnapshot = await fieldInfoRef.get();
            const fieldInfoData = fieldInfoSnapshot.data();
            if (fieldInfoData && fieldInfoData.Location) {
              uniqueLocations.add(fieldInfoData.Location);
            }
          }
        }

        console.log("Unique locations to fetchWeather for", uniqueLocations);
        const API_KEY = process.env.WEATHER_API_KEY;
        for (const location of uniqueLocations) {
          await getWeatherDataForField(db, location, API_KEY);
        }

        console.log("FetchWeatherData function finished!");
      } catch (error) {
        console.error("Error in FetchWeatherData function:", error);
      }
    });

// Daily function to remove expired cache data
exports.cleanupExpiredWeatherData =
  onSchedule("0 0 * * *", async () => { // Runs daily at midnight
    try {
      console.log("CleanupExpiredWeatherData function started!");
      const db = admin.firestore();
      const cachedWeatherSnapshot =
        await db.collection("cachedWeatherData").get();

      const expiryThreshold =
        new Date().getTime() - (WEATHER_DATA_EXPIRY_SECONDS * 1000);

      for (const doc of cachedWeatherSnapshot.docs) {
        const data = doc.data();
        if (data.timestamp &&
          data.timestamp.toDate().getTime() < expiryThreshold) {
          await doc.ref.delete();
          console.log(`Deleted expired cached data
            for location: ${data.location}`);
        }
      }
      console.log("CleanupExpiredWeatherData function finished!");
    } catch (error) {
      console.error("Error cleaning up expired weather data:", error);
    }
  });

exports.irrigationControl = onValueWritten(
    {region: "asia-southeast1", ref: "/irrigationControl/pumpOn"},
    async (event) => {
      const pumpOn = event.data.after.val();
      const previousValue = event.data.before.val();
      console.log(`Irrigation pump control state changed from 
        ${previousValue} to ${pumpOn}`);
      return;
    },
);

const calculateAdjustedMoisture = require("./calculate-adjusted-moisture");
exports.calculateAdjustedMoisture =
  calculateAdjustedMoisture.calculateAdjustedMoisture;

// exports.calculateAdjustedMoisture =
//   functions.region("us-central1").database.ref("/sensor/moisture")
//       .onValueWritten(require("./calculate-adjusted-moisture")
//           .calculateAdjustedMoisture);
