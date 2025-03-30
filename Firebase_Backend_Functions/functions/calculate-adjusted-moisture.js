const fs = require("fs");
const {onValueWritten} = require("firebase-functions/v2/database");
const axios = require("axios");
// const region = require("firebase-functions");
// const functions = require("firebase-functions/v2");
// Read JSON files
const admin = require("firebase-admin");
const kcData = JSON.parse(fs.readFileSync("kcValue.json"));
const soilTypesData = JSON.parse(fs.readFileSync("soilTypes.json"));
const WEATHER_DATA_EXPIRY_SECONDS = 7200;
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast";
// Example: 2 hours expiry
const isExpired = (timestamp) => {
  const now = new Date().getTime();
  const then = timestamp.toDate().getTime();
  return (now - then) >
    WEATHER_DATA_EXPIRY_SECONDS * 1000;
};
// const dbRT = admin.database();
const getLocationData =
  async (db, location) => {
    const cachedWeatherRef =
    db.collection("cachedWeatherData").doc(location);
    const docSnapshot =
      await cachedWeatherRef.get();

    if (docSnapshot.exists) {
      const cachedData = docSnapshot.data();
      if (cachedData.timestamp &&
        !isExpired(cachedData.timestamp)) {
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
  // const API_KEY = process.env.WEATHER_API_KEY;
  const bUrlCurrent = `${WEATHER_API_URL}?`;
  const loc = `q=${location}&`;
  const appIdCurrent = `appid=${API_KEY}&`;
  const uP = `units=metric`;
  const url = bUrlCurrent + loc + appIdCurrent + uP;
  console.log("Fetching current weather for URL:", url);

  try {
    const weatherResponse = await axios.get(url);
    const weatherData = weatherResponse.data;
    const {lat, lon} = weatherData.coord;
    const bUrlForecast = `${FORECAST_API_URL}?`;
    const coor = `lat=${lat}&lon=${lon}&appid=${API_KEY}&`;
    const uPForecast = `units=metric`;
    const forecastUrl = bUrlForecast + coor + uPForecast;
    console.log("Fetching forecast for URL:", forecastUrl);
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
    const cachedWeatherRef = db.collection("cachedWeatherData").doc(location);
    await cachedWeatherRef.set(data);
    console.log(`Weather data fetched and cached for ${location}`);
    return data;
  } catch (error) {
    console.error(`Error fetching weather for ${location}:`, error);
    return null;
  }
};
/**
          * Calculates the total water to release for
          * irrigation based on various parameters.
          *
          * @param {object} soilSensorData - Data from the soil moisture sensor.
          * @param {number} soilSensorData.currentSoilMoistureFraction -
          * The current soil moisture as a fraction (0-1).
          * @param {object} weatherConditions - Current weather conditions.
          * @param {number} weatherConditions.relativeHumidityPercent -
          * The relative humidity percentage.
          * @param {number} weatherConditions.temperatureCelsius -
          * The temperature in Celsius.
          * @param {number} weatherConditions.windSpeedMetersPerSecond -
          * The wind speed in meters per second.
          * @param {number} weatherConditions.atmosphericPressureKPa -
          * The atmospheric pressure in kPa.
          * @param {number} weatherConditions.netRadiationMJPerSquareMeter -
          * The net radiation in MJ per square meter.
          * @param {number} weatherConditions.effectiveRainfallMM -
          * The effective rainfall in millimeters.
          * @param {object} soilParameters -
          * Parameters specific to the soil type.
          * @param {number} soilParameters.fieldCapacityFraction
          * - The field capacity of the soil as a fraction (0-1).
          * @param {number} soilParameters.wiltingPointFraction
          * - The wilting point of the soil as a fraction (0-1).
          * @param {number} soilParameters.rootZoneDepthMM -
          * The root zone depth in millimeters.
          * @param {object} cropParameters - Parameters specific to the crop.
          * @param {number} cropParameters.cropCoefficient - The crop coeff.
          * @param {number} fieldArea - The area of the field in square meters.
          * @return {object} An object containing the irrigation
          * requirement per square meter and the total water to release.
          * @return {string} returns.irrigationPerSquareMeter -
          * The irrigation requirement per square meter
          * in liters (formatted to two decimal places).
          * @return {string} returns.totalWaterToReleaseLiters -
          * The total water to release for the field in liters
          * (formatted to two decimal places).
          */
function calculateTotalWaterToRelease(soilSensorData,
    weatherConditions,
    soilParameters, cropParameters, fieldArea) {
  const temperature = weatherConditions.temperatureCelsius;
  const relativeHumidity = weatherConditions.relativeHumidityPercent;
  const windSpeed = weatherConditions.windSpeedMetersPerSecond;
  const pressure = weatherConditions.atmosphericPressureKPa;
  const netRadiation =
    weatherConditions.netRadiationMJPerSquareMeter;
  const effectiveRainfall =
    weatherConditions.effectiveRainfallMM || 0;
  const soilHeatFlux = 0;
  const fieldCapacity = soilParameters.fieldCapacityFraction;
  const currentSoilMoisture =
    soilSensorData.currentSoilMoistureFraction;
  const rootZoneDepth = soilParameters.rootZoneDepthMM;
  const cropCoefficient = cropParameters.cropCoefficient;
  const svp = 0.6108 * Math.exp((17.27 * temperature) /
    (temperature + 237.3));
  const avp = svp * (relativeHumidity / 100);
  const delta = (4098 * svp) / Math.pow(temperature + 237.3, 2);
  const gamma = 0.000665 * pressure;
  const et0 = (0.408 * delta * (netRadiation - soilHeatFlux) +
    gamma * (900 / (temperature + 273)) * windSpeed * (svp - avp)) /
    (delta + gamma * (1 + 0.34 * windSpeed));
  const etc = cropCoefficient * et0;
  const smd = (fieldCapacity - currentSoilMoisture) * rootZoneDepth;
  const irrigationRequirementPerSquareMeter =
    etc - effectiveRainfall + smd;
  const totalWaterToReleaseLiters =
      irrigationRequirementPerSquareMeter *
        fieldArea * 4047;
  const totalTimeToRelease = (totalWaterToReleaseLiters/950)/60;
  return {
    irrigationPerSquareMeter:
    irrigationRequirementPerSquareMeter.toFixed(2),
    totalWaterToReleaseLiters: totalWaterToReleaseLiters.toFixed(2),
    totalTimeToRelease: totalTimeToRelease.toFixed(2),

  };
}
const {getFirestore} = require("firebase-admin/firestore");
// access firestore through admin
// const dbRT = admin.database();
// access RTDB through admin
exports.calculateAdjustedMoisture = onValueWritten(
    {
      region: "asia-southeast1",
      instance: "iothack-e3e50-default-rtdb",
      ref: "/sensor/moisture",
      secrets: ["WEATHER_API_KEY"],
    },
    async (event) => {
      console.log("WEATHER_API_KEY:",
        process.env.WEATHER_API_KEY ? "defined" : "undefined");
      const moistureLevel = event.data.after.val();
      console.log(`Moisture level reading: ${moistureLevel}`);
      const dbFS = getFirestore();
      const API_KEY = process.env.WEATHER_API_KEY;
      const usersSnapshot = await dbFS.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`Processing user: ${userId}`);

        const fieldsSnapshot = await dbFS.collection("users")
            .doc(userId).collection("fields").get();

        for (const fieldDoc of fieldsSnapshot.docs) {
          const fieldId = fieldDoc.id;
          console.log(`Processing field: ${fieldId}`);

          const fieldInfoRef = dbFS.collection("users")
              .doc(userId).collection("fields").doc(fieldId)
              .collection("FieldInfo").doc("Data");
          const fieldInfoSnapshot = await fieldInfoRef.get();
          const fieldInfoData = fieldInfoSnapshot.data();

          if (!fieldInfoData || !fieldInfoData.Location ||
                  !fieldInfoData.SoilType || !fieldInfoData.CropName ||
                  !fieldInfoData.Area || !fieldInfoData.MonthOfSowing) {
            console.error(`Could not retrieve necessary field
                  information for User: ${userId}, Field: ${fieldId}`);
            continue;
          }
          const location = fieldInfoData.Location;
          const selectedSoilType = fieldInfoData.SoilType;
          const selectedCrop = fieldInfoData.CropName;
          const fieldAreaSquareMeters = parseFloat(fieldInfoData.Area);
          const weatherDataCached = await getLocationData(dbFS, location);
          const monthOfSowingString = fieldInfoData.MonthOfSowing;
          if (!weatherDataCached) {
            console.log(`No cached weather data found for location:
                  ${location}. Attempting to fetch...`);
            const fetchedWeatherData =
                  await getWeatherDataForField(dbFS, location, API_KEY);
            if (fetchedWeatherData) {
              console.log(`Weather data fetched for ${location}`);
              const weatherDataCachedNow =
                    await getLocationData(dbFS, location);
              if (weatherDataCachedNow) {
                await performMoistureCalculationAndSave(
                    dbFS, userId, fieldId, moistureLevel,
                    weatherDataCachedNow,
                    selectedSoilType, selectedCrop, fieldAreaSquareMeters,
                    monthOfSowingString,
                );
              } else {
                console.error(`Failed to retrieve cached weather
                      data for ${location} after fetching.`);
              }
            } else {
              console.error(`Failed to fetch weather
                    data for ${location}.`);
            }
          } else {
            await performMoistureCalculationAndSave(
                dbFS, userId, fieldId, moistureLevel, weatherDataCached,
                selectedSoilType, selectedCrop, fieldAreaSquareMeters,
                monthOfSowingString,
            );
          }
        }
      }
      return;
    },
);
/**
 * Performs the moisture calculation
 * and saves the irrigation recommendation to Firestore.
 *
 * @async
 * @param {FirebaseFirestore.Firestore} db - The Firestore database object.
 * @param {string} userId - The ID of the user.
 * @param {string} fieldId - The ID of the field.
 * @param {number} moistureLevel -
 * The current moisture level reading from the sensor.
 * @param {object} weatherData -
 * The cached weather data object for the field's location.
 * @param {string} selectedSoilType -
 * The soil type selected for the field.
 * @param {string} selectedCrop -
 * The crop selected for the field.
 * @param {number} fieldAreaSquareMeters -
 * The area of the field in square meters.
 * @param {string} monthOfSowingString -
 * The month of sowing of the crop (string).
 * @return {Promise<void>} - A Promise that
 * resolves when the calculation and save operation is complete.
 */
async function performMoistureCalculationAndSave(db,
    userId, fieldId, moistureLevel, weatherData,
    selectedSoilType, selectedCrop, fieldAreaSquareMeters,
    monthOfSowingString) {
  // Read JSON files (these are already read at the top level)
  // const kcData = JSON.parse(fs.readFileSync("kcValue.json"));
  // const soilTypesData = JSON.parse(fs.readFileSync("soilTypes.json"));

  const soilSensorData = {
    currentSoilMoistureFraction: (1024 - moistureLevel) / 1024,
  };

  const soilParameters = soilTypesData[selectedSoilType] || {
    fieldCapacityFraction: 0.35,
    wiltingPointFraction: 0.15,
    rootZoneDepthMM: 500,
  };
  const currentMonth = new Date().getMonth() + 1;
  // const currentYear = new Date().getFullYear();

  let monthsSinceSowing = 0;

  /**
  * Converts a month string (e.g., "January", "February")
  * to its corresponding month number (1-12).
  *
  * @param {string} monthString - The month as a
  * string (case-insensitive).
  * @return {number|null} The month number
  * (1 for January, 12 for December),
  * or null if the provided string is not a valid month.
  */
  function getMonthNumberFromString(monthString) {
    const date = new Date(Date.parse(monthString + " 1, 2023"));
    // Year doesn't matter here
    const month = date.getMonth() + 1;
    return isNaN(month) ? null : month;
  }
  const sowingMonthNumber =
    getMonthNumberFromString(monthOfSowingString);

  if (sowingMonthNumber && typeof sowingMonthNumber === "number" &&
      sowingMonthNumber >= 1 && sowingMonthNumber <= 12) {
    if (sowingMonthNumber <= currentMonth) {
      monthsSinceSowing = currentMonth - sowingMonthNumber;
    } else {
      monthsSinceSowing = (12 - sowingMonthNumber + currentMonth);
    }
  } else {
    console.warn(`Invalid month of sowing provided: ${monthOfSowingString}`);
    return; // Exit if sowing date is invalid
  }

  const typicalGrowthCycle = {
    "wheat": {initial: 1, development: 2, midSeason: 3, lateSeason: 1},
    // Approximate months
    "rice": {initial: 1, development: 2, midSeason: 3, lateSeason: 2},
    // Approximate months
    "corn": {initial: 1, development: 3, midSeason: 3, lateSeason: 2},
    "soybean": {initial: 1, development: 2, midSeason: 3, lateSeason: 2},
    "potato": {initial: 1, development: 2, midSeason: 3, lateSeason: 2},
    // Add more crops and their typical growth cycle durations
  };

  let growthStage = "initial"; // Default
  if (selectedCrop && monthsSinceSowing >= 0) {
    const cropCoefficientsData = kcData.crop_coefficients;
    const selectedCropLower = selectedCrop.toLowerCase();

    if (cropCoefficientsData && cropCoefficientsData[selectedCropLower]) {
      const cropCycle = typicalGrowthCycle[selectedCropLower];

      if (cropCycle) {
        // let accumulatedMonths = 0;
        if (monthsSinceSowing <= cropCycle.initial) {
          growthStage = "initial";
        } else if (monthsSinceSowing <= cropCycle.initial +
          cropCycle.development) {
          growthStage = "development";
        } else if (monthsSinceSowing <= cropCycle.initial + cropCycle.initial +
          cropCycle.development + cropCycle.midSeason) {
          growthStage = "mid-season";
        } else {
          growthStage = "late-season";
        }
      } else {
        console.warn(`Growth cycle duration not defined for crop:
          ${selectedCrop}`);
      }
    } else {
      console.warn(`Crop coefficients not found for crop: ${selectedCrop}`);
    }
  } else {
    console.warn("Month of sowing not available or invalid.");
  }

  console.log(`Calculated growth stage for ${selectedCrop}:
    ${growthStage} (Months since sowing: ${monthsSinceSowing})`);
  // const selectedGrowthStage = "initial";
  const selectedGrowthStage = growthStage;

  const selectedCropCoefficients =
    kcData.crop_coefficients &&
    kcData.crop_coefficients[selectedCrop];
  const cropCoefficient =
    selectedCropCoefficients &&
    selectedCropCoefficients[selectedGrowthStage] ?
    selectedCropCoefficients[selectedGrowthStage] :
    1.0;
  const cropParameters = {
    cropCoefficient: cropCoefficient,
  };

  const temperatureCelsius = weatherData.temperature;
  const rawHumidity = weatherData.humidity;
  const windSpeedMetersPerSecond = weatherData.windspeed;
  const atmosphericPressureKPa = weatherData.pressure;
  const effectiveRainfallMM = weatherData.rain || 0;
  const netRadiationMJPerSquareMeter = 20;

  const saturationVaporPressure =
      0.6108 * Math.exp((17.27 * temperatureCelsius) /
      (temperatureCelsius + 237.3));
  const actualVaporPressure =
      (rawHumidity / 100) * saturationVaporPressure;
  const relativeHumidityPercent = (actualVaporPressure /
      saturationVaporPressure) * 100;

  const weatherConditions = {
    relativeHumidityPercent: relativeHumidityPercent,
    temperatureCelsius: temperatureCelsius,
    windSpeedMetersPerSecond: windSpeedMetersPerSecond,
    atmosphericPressureKPa: atmosphericPressureKPa,
    netRadiationMJPerSquareMeter:
        netRadiationMJPerSquareMeter,
    effectiveRainfallMM: effectiveRainfallMM,
  };

  const waterCalculation = calculateTotalWaterToRelease(
      soilSensorData,
      weatherConditions,
      soilParameters,
      cropParameters,
      fieldAreaSquareMeters,
  );
  console.log(`Irrigation Calculation Result for User:
    ${userId}, Field: ${fieldId}:`, waterCalculation);

  const recommendationRef = db.collection("users")
      .doc(userId).collection("fields").doc(fieldId)
      .collection("RecommendationInfo").doc("Data");
  await recommendationRef.set(waterCalculation);
}
