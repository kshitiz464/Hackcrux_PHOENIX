#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

// WiFi Credentials
#define WIFI_SSID "Kunal"
#define WIFI_PASSWORD "123456789"

// Firebase Configuration
#define FIREBASE_HOST "https://iothack-e3e50-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "WnurmE828aySFokJuIwXaXaLIDvEysKJ47jmILzO"

FirebaseData fbData;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {
    Serial.begin(115200);

    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("WiFi Connected!");

    // Configure Firebase
    config.host = FIREBASE_HOST;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;
    
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
}

void loop() {
    float moisture = analogRead(A0);  // Read sensor value

    Serial.print("Sending data to Firebase: ");
    Serial.println(moisture);

    // New method using FirebaseESP8266
    bool success = Firebase.setFloat(fbData, "/sensor/moisture", moisture);
    
    if (success) {
        Serial.println("✅ Data sent successfully!");
    } else {
        Serial.print("❌ Failed to send data: ");
        Serial.println(fbData.errorReason());
    }

    delay(30000);  // Send data every 5 seconds
}


