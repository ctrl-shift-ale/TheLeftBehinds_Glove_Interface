#include <WiFi.h>
#include <WiFiUdp.h>
#include <cmath> // Required for log and exp

// Array of SSIDs and passwords
const char* ssids[] = {"LeftBehinds", "EXT2-CommunityFibre10Gb_36CD6", "Telecom-55619115"};
const char* passwords[] = {"DontLeaveMeBehind", "ccucykwier", "IrHxJ0C2eGUvbEWlgc8uKTzM"};

// Enum for network indices
enum NetworkIndex {
  LEFTBEHINDS = 0,
  ALE = 1,
  ELA = 2
};

// CONFIGURE
const bool DEBUG = false;
const NetworkIndex selectedNetwork = LEFTBEHINDS;
const unsigned long reportInterval = 10000; // ms
const int testFreq = 150; // ms

// UDP settings
WiFiUDP udp;
IPAddress laptopIP;
const int udpPort = 4040;

// Static IP configuration
IPAddress local_IP(192, 168, 1, 100);  // Static IP for ESP32
IPAddress gateway(192, 168, 1, 1);     // Router gateway
IPAddress subnet(255, 255, 255, 0);    // Subnet mask 

// Time tracking
unsigned long sendTime = 0;
unsigned long receiveTime = 0;

// Statistics
int totalPackets = 0;
int successfulPackets = 0;
float averageLatency = 0; // Arithmetic mean
float geometricSumLog = 0; // Sum of log(latencies)
float packetLoss = 0;
long minLatency = testFreq;
long maxLatency = 0;


// Wi-Fi Signal
int wifiSignalStrength = 0; // To store RSSI value

// Status
bool receivedLaptopIP = false;

// Timer for statistics reporting
unsigned long lastReportTime = 0;

void setup() {
  Serial.begin(115200);

  // Connect to the selected network
  Serial.println("Connecting to Wi-Fi...");

  WiFi.config(local_IP, gateway, subnet);
  WiFi.begin(ssids[selectedNetwork], passwords[selectedNetwork]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected");
  Serial.print("Connected to: ");
  Serial.println(ssids[selectedNetwork]);
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  udp.begin(udpPort);
}

void loop() {
  if (!receivedLaptopIP) {
    listenForHandshake();
  } else {
    
    if (millis() - lastReportTime > reportInterval) {
      // Periodically report statistics
      reportStatistics(); 
      averageLatency = 0;
      geometricSumLog = 0; // Sum of log(latencies)
      minLatency = testFreq;
      maxLatency = 0;
      totalPackets = 0;
      successfulPackets = 0;

      lastReportTime = millis();
    }
    sendUDP();
    receiveUDP();
  }
  delay(testFreq); // Wait before the next loop
}

void listenForHandshake() {
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    char buffer[255];
    int len = udp.read(buffer, 255);
    if (len > 0) {
      buffer[len] = '\0';
    }

    String message = String(buffer);
    if (message.startsWith("HANDSHAKE:")) {
      String ipString = message.substring(10); // Extract IP address after "HANDSHAKE:"
      laptopIP.fromString(ipString); // Convert string to IPAddress
      receivedLaptopIP = true;
      lastReportTime = millis();
      Serial.print("Received handshake from laptop. IP set to: ");
      Serial.println(laptopIP);
      Serial.print("Collecting networking data for the next ");
      Serial.print(reportInterval/1000);
      Serial.println(" sec time window");
    }
  }
}

void sendUDP() {
  String message = String(millis()); // Include timestamp in the message
  udp.beginPacket(laptopIP, udpPort);
  udp.print(message);
  bool packetSent = udp.endPacket(); // Returns true if packet is sent successfully
  
  sendTime = millis();
  totalPackets++;
  if (DEBUG) {
    Serial.print("Packet sent: ");
    Serial.println(packetSent ? "Success" : "Failed");
    Serial.print("Target IP: ");
    Serial.println(laptopIP);
  }
}


void receiveUDP() {
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    char buffer[255];
    int len = udp.read(buffer, 255);
    if (len > 0) {
      buffer[len] = '\0';
    }
    
    receiveTime = millis();
    long latency = receiveTime - sendTime;

    if (latency < minLatency) {
      minLatency = latency;
    }
    if (latency > maxLatency) {
      maxLatency = latency;
    }
    
    successfulPackets++;
    averageLatency = ((averageLatency * (successfulPackets - 1)) + latency) / successfulPackets;
    if (latency > 0) {
      geometricSumLog += log(float(latency)); // Accumulate log(latency)
    }
    packetLoss = 100.0 * (1 - ((float)successfulPackets / totalPackets));
    
    if (DEBUG) {
      Serial.print("Round-trip latency: ");
      Serial.print(latency);
      Serial.println(" ms");
      Serial.print("geometricSumLog: ");
      Serial.println(geometricSumLog);
    }
  }
}

void reportStatistics() {
  float geometricAverage = exp(geometricSumLog / successfulPackets); // Calculate geometric mean
  float consistencyIndicator = averageLatency / geometricAverage; // Ratio between averages

  // Update Wi-Fi Signal Strength
  wifiSignalStrength = WiFi.RSSI();

  // Determine connection quality
  String connectionQuality;
  if (wifiSignalStrength >= -30) {
    connectionQuality = "Excellent";
  } else if (wifiSignalStrength >= -50) {
    connectionQuality = "Good";
  } else if (wifiSignalStrength >= -70) {
    connectionQuality = "Fair";
  } else {
    connectionQuality = "Poor";
  }

  Serial.println("\n--- Statistics ---");
  Serial.print("Total Packets Sent: ");
  Serial.println(totalPackets);
  Serial.print("Successful Packets: ");
  Serial.println(successfulPackets);
  Serial.print("Packet Loss: ");
  Serial.print(packetLoss);
  Serial.println(" %");
  Serial.print("Average Latency (Arithmetic): ");
  Serial.print(averageLatency);
  Serial.println(" ms");
  Serial.print("Geometric Average Latency: ");
  Serial.print(geometricAverage);
  Serial.println(" ms");
  Serial.print("Max Latency to date: ");
  Serial.println(maxLatency);
  Serial.print("Min Latency to date: ");
  Serial.println(minLatency);
  Serial.print("Consistency Indicator (Arith/Geo): ");
  Serial.println(consistencyIndicator);
  Serial.print("Wi-Fi Signal Strength (RSSI): ");
  Serial.print(wifiSignalStrength);
  Serial.print(" dBm (");
  Serial.print(connectionQuality);
  Serial.println(")");
  Serial.println("------------------");
  Serial.print("\nCollecting networking data for the next ");
  Serial.print(reportInterval/1000);
  Serial.println(" sec time window\n");
}

