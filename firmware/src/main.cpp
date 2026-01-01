#include <Arduino.h>
#include "esp_bt.h"
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <FirebaseClient.h>
#include "time.h"
#include <math.h>
#include <esp_sleep.h>

#include "wifi.util.h"
#include "database.h"

#define SOUND_SPEED 0.034
#define CM_TO_INCH 0.393701
#define SITTING_DISTANCE 70
#define STANDING_DISTANCE 90
#define RXp2 17
#define BME280_ADDRESS 0x76
#define DEEP_SLEEP_DURATION 60
#define SDA_PIN 6
#define SCL_PIN 7

Preferences preferences;
Adafruit_BME280 bme;
RealtimeDatabase realtimeDBInstance;
const char * ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 3600;
bool isSubscribed = false;
bool isNeedRun = true;
bool measurementComplete = false;

int getTimestamp() {
  struct tm timeInfo;

  getLocalTime(& timeInfo);

  time_t timestamp = mktime(&timeInfo);

  return static_cast<int> (timestamp);
}

int getTimeDifferenceInHours(int timestamp1, int timestamp2) {
  int differenceInSeconds = abs(timestamp1 - timestamp2);
  int differenceInHours = differenceInSeconds / 3600;
  return differenceInHours;
}

bool initializingTempSensor() {
  Serial.println("Initializing BME280...");

  for (int i = 0; i < 5; i++) {
    if (bme.begin(BME280_ADDRESS)) {
      Serial.println("BME280 initialized!");
      return true;
    }
    Serial.println("Retrying...");
    delay(500);
  }

  Serial.println("BME280 failed! Stopping...");

  while (true) {
    delay(1000);
  }
}

float getCurrentSeaLevelPressure() {
  int lastFetchAt = preferences.getInt("slplf", 0);

  if (getTimeDifferenceInHours(getTimestamp(), lastFetchAt) <= 24) {
    return preferences.getInt("slp");
  }

  HTTPClient http;

  http.begin("https://api.open-meteo.com/v1/forecast?latitude=54.0359&longitude=19.0266&current=surface_pressure");

  int httpResponseCode = http.GET();

  if (httpResponseCode == HTTP_CODE_OK) {
    String payload = http.getString();

    JsonDocument doc;

    DeserializationError error = deserializeJson(doc, payload);

     if (!error) {
      float seaLevelPressure = doc["current"]["surface_pressure"].as<float>();
      preferences.putInt("slp", seaLevelPressure);
      preferences.putInt("slplf", getTimestamp());
      
      return seaLevelPressure;
    } else {
      return 0;
    }
  }

  http.end();
  return 0;
}

void runMeasuring() {
  JsonWriter writer;

  object_t json, temperatureObj, humidityObj, pressureObj, altitudeObj, dateObj;

  const int timestamp = getTimestamp();

  float currentSeaLevelPressure = getCurrentSeaLevelPressure();
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;
  float altitude = bme.readAltitude(currentSeaLevelPressure);

  writer.create(temperatureObj, "temperature", temperature);
  writer.create(dateObj, "date", timestamp);
  writer.create(humidityObj, "humidity", humidity);
  writer.create(pressureObj, "pressure", pressure);
  writer.create(altitudeObj, "altitude", altitude);
  writer.join(json, 5, temperatureObj, dateObj, humidityObj, pressureObj, altitudeObj);

  createDBRecord("temp_sensor_items", json);

  measurementComplete = true;
}

void cleanupAndSleep() {
  bme.setSampling(
    Adafruit_BME280::MODE_SLEEP,
    Adafruit_BME280::SAMPLING_NONE,
    Adafruit_BME280::SAMPLING_NONE,
    Adafruit_BME280::SAMPLING_NONE,
    Adafruit_BME280::FILTER_OFF
  );

  delay(1000);
  
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  btStop();

  delay(600);

  Serial.end();

  esp_sleep_enable_timer_wakeup(DEEP_SLEEP_DURATION * 1000000);
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);
  Wire.begin(SDA_PIN, SCL_PIN);

  preferences.begin("tempo-sensor");

  initializingTempSensor();
  connectToWifi();
  waitForWiFiConnection();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  realtimeDBInstance = connectToDB();
}

void loop() {
  waitForAuthenticationDB(); 

  realtimeDBInstance.loop();

  if (isNeedRun && !measurementComplete) {
    runMeasuring();
  }
  
  if (measurementComplete) {
    cleanupAndSleep();
  }
}
