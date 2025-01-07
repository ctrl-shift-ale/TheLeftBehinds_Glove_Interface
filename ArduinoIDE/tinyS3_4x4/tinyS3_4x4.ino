// this script is meant to work together with "Glove_Tiny_4x4.m4l" Max for Live device
// please check https://github.com/ctrl-shift-ale/TheLeftBehinds_Glove_Interface

#include <UMS3.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <OSCMessage.h>
#include <Arduino.h>

// Configuration
const int N_INS = 8;
const bool WIFI_MODE = true; // if false, then use serial to send osc messages
const bool OFFLINE_MODE = false; // false -> try to connect to a wi-Fi endlessly at init. true -> switch to serial after reaching the connection timeout Limit
const int CONNECTION_TIMEOUT_MS = 120000;
const bool IDLE_MODE = true;
const int IDLEMODE_CHECK_INTERVAL_MS = 30000;
const bool SERIAL_PRINT = false; 
const bool BATTERY_PRINT = false;
unsigned long REFRESH_MS  = 100;
unsigned long REFRESH_BATTERY_MS = 40000;
const uint8_t LED_BRIGHTNESS = 255/3;
const int IDLE_CPU_FREQUENCY = 80;
const int LO_POWER_CPU_FREQUENCY = 160;
const int NORMAL_CPU_FREQUENCY = 240;

// Array of SSIDs and PASSWORDS 
const char* SSIDS[] = {"LeftBehinds", "EXT2-CommunityFibre10Gb_36CD6", "Telecom-55619115"};
const char* PASSWORDS[] = {"DontLeaveMeBehind", "ccucykwier", "IrHxJ0C2eGUvbEWlgc8uKTzM"};

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
float batteryPercentage = 0;

// SENSORS
const int FLEXO_0 = 2;
const int FLEXO_1 = 3;
const int FLEXO_2 = 4;
const int FLEXO_3 = 5;
const int BUTTON_0 = 9; //6
const int BUTTON_1 = 8; //7
const int BUTTON_2 = 7; //
const int BUTTON_3 = 6; //9
//const int LED_DATA = 18;
//const int LED_PWR = 17;

int ins[] = {FLEXO_0, FLEXO_1, FLEXO_2, FLEXO_3, BUTTON_0, BUTTON_1, BUTTON_2, BUTTON_3};
int insVal[] = {0, 0, 0, 0, 0, 0, 0, 0};
int insVal_prev[] = {0, 0, 0, 0, 0, 0, 0, 0};

const int maxADCVal = 8190;


int32_t timestamp = 0;

UMS3 ums3;

void setup() {
    
  
  setPowerNormalMode();
  Serial.begin(115200);
  WiFi.setSleep(false);
  WiFi.mode(WIFI_STA);

  analogReadResolution(13);  // Up to 13-bit resolution for ESP32-S3 (0-8191)
  analogSetAttenuation(ADC_11db);  // Covers 0-3.3V range

  // Initialize all board peripherals, call this first
  ums3.begin();
  ums3.setPixelPower(true);

  delay(500);
  Serial.println("setting up...");

  batteryInit();

  // Configure static IP
  WiFi.config(local_IP, gateway, subnet);
  WiFi.begin(SSIDS[selectedNetwork], PASSWORDS[selectedNetwork]);

  if (WIFI_MODE) {
    // Wait for Wi-Fi connection
    int connectionTimeOut_clocker = 0;
    bool blink = false;

    int wiFiLoop_ms = 500;
    int LEDblink_ms = wiFiLoop_ms/2;
    while ( (WiFi.status() != WL_CONNECTED) && (!(connectionTimeout)) ) {  
        blinkLED(255, 0, 0, 1, LEDblink_ms);  // Red blinking when attempting connection
        blink = !(blink);
        delay(wiFiLoop_ms - LEDblink_ms);
        
        Serial.println("Connecting to WiFi...");
        connectionTimeOut_clocker = connectionTimeOut_clocker + wiFiLoop_ms;
        if ( (OFFLINE_MODE) && (connectionTimeOut_clocker >= CONNECTION_TIMEOUT_MS) ) {
            connectionTimeout = true;
            Serial.println("Connection TimeOut. Working in offline mode (OSC via SERIAL)");
        }
    }
  
    if (!(connectionTimeout)) {
        wiFiConnected = true;
        blinkLED(0, 255, 0, 5, 200);  // Green blink for successful connection
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
    if (millis() - lastUpdateTime >= REFRESH_MS) {
        lastUpdateTime = millis();
        readSensors();
        sendData(); // OSC or Serial
        receiveData(); 
        battery();
        
    }

}


void idleMode() {
    Serial.println("Entering power save (idle) with periodic polling...");
    setIdleMode();
    delay((uint32_t)IDLEMODE_CHECK_INTERVAL_MS);

    while (true) {
        
        // Code resumes here after waking up
        //setCpuFrequencyMhz(NORMAL_CPU_FREQUENCY);
        Serial.println("Woke up to check for OSC messages...");

        OSCMessage pollingMsg("/polling");
        pollingMsg.add((int32_t)1);
        Udp.beginPacket(laptop_IP, sendPort);  // Send to laptop
        pollingMsg.send(Udp);
        Udp.endPacket();
        pollingMsg.empty();

        // Poll for OSC messages
        if (checkForWakeupMessage()) {
            Serial.println("Wakeup message received! Resuming normal operation...");
            break; // Exit the sleep loop
        }
        //setIdleMode();
        Serial.println("No wake up message received. Keep staying in power save mode");
        delay(IDLEMODE_CHECK_INTERVAL_MS);       
    }
}

bool checkForWakeupMessage() {
    int packetSize = Udp.parsePacket();
    if (packetSize) {
        OSCMessage msgIn;
        while (packetSize--) {
            msgIn.fill(Udp.read());
      }
        if (!msgIn.hasError()) {
            if (msgIn.match("/power")) {
                int power = msgIn.getInt(0);
                if (power != 0) {
                    ums3.setPixelPower(true); //turn leds off to save power
                    blinkLED(128, 0, 128, 5, 200);  // Purple blinking when awakening from light sleep
                    ums3.setPixelPower(false); //turn leds off to save power
                    if (power == 1) {
                        setPowerSaveMode();
                    }
                    if (power == 2) {
                        setPowerNormalMode();
                    }
                    return true; // `/wakeup` message received
                }
            }
        } else {
            Serial.println("OSC message error");
        }
    }
    return false; // No `/wakeup` message received
}

void setIdleMode() {
    setCpuFrequencyMhz(IDLE_CPU_FREQUENCY);
    if ((wiFiConnected) && (receivedLaptopIP)) {
        OSCMessage powerModeMsg("/power-mode");
        powerModeMsg.add((int32_t)0);
        Udp.beginPacket(laptop_IP, sendPort);
        powerModeMsg.send(Udp);
        Udp.endPacket();
        powerModeMsg.empty();
        //Serial.println("SENDING /power-mode osc message ");
    }
    if (SERIAL_PRINT) {
        Serial.println("POWER MODE SET TO IDLE ");
    }
}

void setPowerSaveMode() {
    setCpuFrequencyMhz(LO_POWER_CPU_FREQUENCY);
    if ((wiFiConnected) && (receivedLaptopIP)) {
        OSCMessage powerModeMsg("/power-mode");
        powerModeMsg.add((int32_t)1);
        Udp.beginPacket(laptop_IP, sendPort);
        powerModeMsg.send(Udp);
        Udp.endPacket();
        powerModeMsg.empty();
        //Serial.println("SENDING /power-mode osc message ");
    }
    if (SERIAL_PRINT) {
        Serial.println("POWER MODE SET TO POWER SAVE ");
    }
}

void setPowerNormalMode() {
  setCpuFrequencyMhz(NORMAL_CPU_FREQUENCY);
    if ((wiFiConnected) && (receivedLaptopIP)) {
        OSCMessage powerModeMsg("/power-mode");
        powerModeMsg.add((int32_t)2);
        Udp.beginPacket(laptop_IP, sendPort);
        powerModeMsg.send(Udp);
        Udp.endPacket();
        powerModeMsg.empty();
        //Serial.println("SENDING /power-mode osc message ");
    }
    if (SERIAL_PRINT) {
        Serial.println("POWER MODE SET TO NORMAL ");
    }
}

void batteryInit() {
    batteryPercentage = vToPercentage(ums3.getBatteryVoltage());
    if (BATTERY_PRINT) {
        Serial.print("Battery Percentage: ");
        Serial.println(batteryPercentage);
    }
}

void battery() {
    voltage_sum += ums3.getBatteryVoltage();
    batteryCounter += 1;
    batteryTimer += REFRESH_MS;
    if (batteryTimer >= REFRESH_BATTERY_MS) {
        batteryPercentage = vToPercentage(voltage_sum/batteryCounter);
        if (BATTERY_PRINT) {
            Serial.print("Battery Voltage: ");
            Serial.print(voltage_sum/batteryCounter);
            Serial.println(" V");
            Serial.print("Battery Percentage: ");
            Serial.println(batteryPercentage);
        }
        //reset 
        batteryTimer = 0;
        batteryCounter = 0;
        voltage_sum = 0;
        
        if ( (wiFiConnected) && (receivedLaptopIP) ) { 
            sendBatteryPercentage();
        }
    }
}

void readSensors() {
    for (int i = 0; i < N_INS; i++) {
        if (ins[i] != -1) {
            insVal[i] = maxADCVal - analogRead(ins[i]);
        }
    }
}

void sendData() {
    if ((wiFiConnected) && (receivedLaptopIP)) {
        OSCMessage sensorsMsg("/sensors");

        for (int i = 0; i < N_INS; i++) {
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
            for (int i = 0; i < N_INS; i++) {
                Serial.print("PIN ");
                Serial.print(ins[i]);
                Serial.print(": ");
                Serial.print(insVal[i]); 
                Serial.print(" ");
            }
            Serial.println();
        }
        
    }

    timestamp += REFRESH_MS;
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
                msgIn.route("/power", receivePower);
            } else {
                Serial.println("OSC message error");
            }
        }
    
    } else if ( (OFFLINE_MODE) && (Serial.available()) ) {
        if (Serial.read() == HEADER) { 
            REFRESH_MS = Serial.read();
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
    sendBatteryPercentage();

    blinkLED(0, 0, 255, 5, 200);  // Blue blinking when attempting handshake
    ums3.setPixelPower(false); //turn leds off to save power

    if (IDLE_MODE) {
        delay(100);
        idleMode();
    }
}

// Send a handshake message to the laptop
void sendHandshake() {
  OSCMessage msgOut("/reply-handshake");
  Udp.beginPacket(laptop_IP, sendPort);  // Send to laptop
  msgOut.send(Udp);
  Udp.endPacket();
  msgOut.empty();
  Serial.println("Handshake reply sent!");
  

}

void sendBatteryPercentage() {
    OSCMessage batteryMsg("/battery");
    batteryMsg.add((float)batteryPercentage);   
    Udp.beginPacket(laptop_IP, sendPort);
    batteryMsg.send(Udp);
    Udp.endPacket();
    batteryMsg.empty();
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
    REFRESH_MS = msg.getInt(0); // Assuming the first argument is an integer
    if (SERIAL_PRINT) {
        Serial.print("CLOCK RECEIVED: ");
        Serial.println(REFRESH_MS);
    }
}

void receivePower(OSCMessage &msg, int addrOffset) {
    int powerMode = msg.getInt(0); // Assuming the first argument is an integer
    Serial.print("Power mode remotely set to ");
    Serial.println(powerMode);

    if (powerMode == 0) {
        idleMode();

    } else if (powerMode == 1) {
        setPowerSaveMode();
    } else if (powerMode == 2) {
        setPowerNormalMode();
    }  
}


// Function to blink the LED
void blinkLED(uint8_t red, uint8_t green, uint8_t blue, int n_blinks, int rate_ms) {
  int del = rate_ms/2;
  for (int i = 0; i < n_blinks; i++) {
    ums3.setPixelColor(red,green,blue);
    ums3.setPixelBrightness(LED_BRIGHTNESS);
    delay(del);
    ums3.setPixelBrightness(0);
    delay(del);
  }
}

// Function to convert battery voltage to battery charge %
float vToPercentage(float battery) {
    // Constants derived from the fitted exponential formula
    const float a = 0.154;       // Scale factor
    const float b = 1.581;       // Exponential growth rate
    const float c = -17.64;      // Offset

    // Calculate SOC based on the battery voltage
    float percentage = a * exp(b * battery) + c;

    // Constrain the result to the range 0-100%
    percentage = constrain(percentage, 0, 100);

    return percentage;
}

