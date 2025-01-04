#include <UMS3.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>
#include <Arduino.h>
//#include <Adafruit_NeoPixel.h>  // For controlling RGB LED

// Configuration
const int nins = 8;
const bool wiFiMode = true; // if false, then use serial to send osc messages
const bool offlineMode = false; // false -> try to connect to a wi-Fi endlessly at init. true -> switch to serial after reaching the connection timeout Limit
const int connectionTimeOut_timeLimit = 120000;
const bool SERIAL_PRINT = true; 
const bool BATTERY_PRINT = false;
unsigned long updateInterval  = 100;
unsigned long updateBatteryInterval  = 5000;

// Array of SSIDs and passwords 
const char* ssids[] = {"LeftBehinds", "EXT2-CommunityFibre10Gb_36CD6", "Telecom-55619115"};
const char* passwords[] = {"DontLeaveMeBehind", "ccucykwier", "IrHxJ0C2eGUvbEWlgc8uKTzM"};

// Enum for network indices
enum NetworkIndex {
  LEFTBEHINDS = 0,
  ALE = 1,
  ELA = 2
};
const NetworkIndex selectedNetwork = ALE;

//const char* ssid_Debbie = "BT-FCACXW";
//const char* password_Debbie = "rb7bQYfghCdPMx";


// Static IP configuration
IPAddress local_IP(192, 168, 1, 100);  // Static IP for ESP32
IPAddress gateway(192, 168, 1, 1);     // Router gateway
IPAddress subnet(255, 255, 255, 0);    // Subnet mask 

// OSC and UDP configuration
WiFiUDP Udp;
const int receivePort = 8000; //11001;  // Port to listen for OSC messages
const int sendPort = 8800; // Port to listen for incoming OSC messages
IPAddress laptop_IP;           // Variable to store the laptop's IP

bool wiFiConnected = false;
bool connectionTimeout = false;
bool receivedLaptopIP = false;


unsigned long lastUpdateTime = 0;


const char HEADER = 'H';   

//BATTERY
int batteryTimer = 0;
int batteryCounter = 0;
float voltage_sum = 0;
// SENSORS

const int FLEXO_0 = 2;
const int FLEXO_1 = 3;
const int FLEXO_2 = 4;
const int FLEXO_3 = 5;
const int BUTTON_0 = 9; //6
const int BUTTON_1 = 8; //7
const int BUTTON_2 = 6; //
const int BUTTON_3 = 7; //9
const int LED_DATA = 18;
const int LED_PWR = 17;

int ins[] = {FLEXO_0, FLEXO_1, FLEXO_2, FLEXO_3, BUTTON_0, BUTTON_1, BUTTON_2, BUTTON_3};
int insVal[] = {0, 0, 0, 0, 0, 0, 0, 0};
int insVal_prev[] = {0, 0, 0, 0, 0, 0, 0, 0};

const int maxADCVal = 8190;


int32_t timestamp = 0;

UMS3 ums3;

void setup() {
  Serial.begin(115200);
  WiFi.setSleep(false);
  WiFi.mode(WIFI_STA);

  analogReadResolution(13);  // Up to 13-bit resolution for ESP32-S3 (0-8191)
  analogSetAttenuation(ADC_11db);  // Covers 0-3.3V range

  // Initialize all board peripherals, call this first
  ums3.begin();
  // Brightness is 0-255. We set it to 1/3 brightness here
  ums3.setPixelBrightness(255 / 3);
  // Enable the power to the RGB LED.
  // Off by default so it doesn't use current when the LED is not required.
  ums3.setPixelPower(true);

  delay(500);
  Serial.println("setting up...");

  // Configure static IP
  WiFi.config(local_IP, gateway, subnet);
  WiFi.begin(ssids[selectedNetwork], passwords[selectedNetwork]);

  if (wiFiMode) {
    // Wait for Wi-Fi connection
    int connectionTimeOut_clocker = 0;
    bool blink = false;
    ums3.setPixelColor(255,0,0);

    while ( (WiFi.status() != WL_CONNECTED) && (!(connectionTimeout)) ) {  
      //blinkLED(255, 0, 0, 100);  // Red blinking when attempting connection
      blink = !(blink);
      uint8_t brightness = 150*blink;
      ums3.setPixelBrightness(brightness);

      delay(500);
      battery();
      Serial.println("Connecting to WiFi...");
      connectionTimeOut_clocker = connectionTimeOut_clocker + 500;
      if ( (offlineMode) && (connectionTimeOut_clocker >= connectionTimeOut_timeLimit) ) {
        connectionTimeout = true;
        Serial.println("Connection TimeOut. Working in offline mode (OSC via SERIAL)");
      }
    }
  
    if (!(connectionTimeout)) {
      wiFiConnected = true;
      //blinkLED(0, 255, 0, 200);  // Green blink for successful connection
      Serial.println("WiFi connected!");
      Serial.print("ESP32 IP address: ");
      Serial.println(WiFi.localIP()); // Display the IP address
      // Start UDP listener
      Udp.begin(receivePort);
      Serial.printf("Listening for OSC messages on port %d\n", receivePort);
    }
  }
  
}

void loop() {
    if (millis() - lastUpdateTime >= updateInterval) {
        lastUpdateTime = millis();
        readSensors();
        sendData(); // OSC or Serial
        receiveData(); 
        battery();
        
    }

}

void battery() {
    voltage_sum += ums3.getBatteryVoltage();
    batteryCounter += 1;
    batteryTimer += updateInterval;
    if (batteryTimer >= updateBatteryInterval) {
        float percentage = vToPercentage(voltage_sum/batteryCounter);
        if (BATTERY_PRINT) {
            Serial.print("Battery Voltage: ");
            Serial.print(voltage_sum/batteryCounter);
            Serial.println(" V");
            Serial.print("Battery Percentage: ");
            Serial.println(percentage);
        }
        //reset 
        batteryTimer = 0;
        batteryCounter = 0;
        voltage_sum = 0;
        
        if ( (wiFiConnected) && (receivedLaptopIP) ) { 
            OSCMessage batteryMsg("/battery");
            batteryMsg.add((float)percentage);
            
            // Send OSC message for sensors
            Udp.beginPacket(laptop_IP, sendPort);
            batteryMsg.send(Udp);
            Udp.endPacket();
            batteryMsg.empty();
        }
    }
}

float vToPercentage(float battery) {
    // Constants derived from the fitted exponential formula
    const float a = 0.154;       // Scale factor
    const float b = 1.581;       // Exponential growth rate
    const float c = -17.64;      // Offset

    // Calculate SOC based on the battery voltage
    float batteryPercentage = a * exp(b * battery) + c;

    // Constrain the result to the range 0-100%
    batteryPercentage = constrain(batteryPercentage, 0, 100);

    return batteryPercentage;
}

void readSensors() {
    for (int i = 0; i < nins; i++) {
        if (ins[i] != -1) {
            insVal[i] = maxADCVal - analogRead(ins[i]);
        }
    }
}

void sendData() {
    if ((wiFiConnected) && (receivedLaptopIP)) {
        OSCMessage sensorsMsg("/sensors");

        for (int i = 0; i < nins; i++) {
            sensorsMsg.add((int32_t)insVal[i]);
        }

        sensorsMsg.add((int32_t)timestamp);
        
        // Send OSC message for sensors
        Udp.beginPacket(laptop_IP, sendPort);
        sensorsMsg.send(Udp);
        Udp.endPacket();
        sensorsMsg.empty();
    } else {
        if (SERIAL_PRINT) {    
            for (int i = 0; i < nins; i++) {
                Serial.print("PIN ");
                Serial.print(ins[i]);
                Serial.print(": ");
                Serial.print(insVal[i]); 
                Serial.print(" ");
            }
            Serial.println();
        }
        
    }

    timestamp += updateInterval;
}


void receiveData() {
    if (wiFiConnected) {
        int packetSize = Udp.parsePacket();
        if (packetSize) {
            OSCMessage msgIn;
            while (packetSize--) {
                msgIn.fill(Udp.read());
            }
            if (!msgIn.hasError()) {
                msgIn.route("/request-handshake", receiveHandshake);
                msgIn.route("/ping", receivePing);
                msgIn.route("/clock", receiveClock);
            } else {
                Serial.println("OSC message error");
            }
        }
    
    } else if ( (offlineMode) && (Serial.available()) ) {
        if (Serial.read() == HEADER) { 
            updateInterval = Serial.read();
        }
    }
}
// Function to handle incoming OSC messages
void receiveHandshake(OSCMessage &msg, int addrOffset) {
  // Get the sender's IP address from the UDP packet
  laptop_IP = Udp.remoteIP();
  receivedLaptopIP = true;
  Serial.print("Laptop's IP Address: ");
  Serial.println(laptop_IP);

  // Send a handshake message back to the laptop
  delay(100);
  sendHandshake();
}

// Send a handshake message to the laptop
void sendHandshake() {
  OSCMessage msgOut("/reply-handshake");
  Udp.beginPacket(laptop_IP, sendPort);  // Send to laptop
  msgOut.send(Udp);
  Udp.endPacket();
  msgOut.empty();
  Serial.println("Handshake reply sent!");
  //blinkLED(0, 0, 255, 200);  // Blue blinking when attempting handshake
}

void receivePing(OSCMessage &msg, int addrOffset) {
  //Serial.println("PING RECEIVED");

  // Send a  message back to the laptop
  //delay(5);
  sendPing();
}

// Send a pingback message to the laptop
void sendPing() {
  OSCMessage msgOut("/return-ping");
  Udp.beginPacket(laptop_IP, sendPort);  // Send to laptop
  msgOut.send(Udp);
  Udp.endPacket();
  //msgOut.empty();
}

void receiveClock(OSCMessage &msg, int addrOffset) {
  updateInterval = msg.getInt(0); // Assuming the first argument is an integer
  //Serial.print("CLOCK RECEIVED: ");
  //Serial.println(clock);
}

/*
// Function to blink the LED
void blinkLED(uint8_t red, uint8_t green, uint8_t blue, int delayTime) {
  for (int i = 0; i < 5; i++) {
    strip.setPixelColor(0, strip.Color(red, green, blue));
    strip.show();
    delay(delayTime);
    strip.clear();
    strip.show();
    delay(delayTime);
  }
}
*/

