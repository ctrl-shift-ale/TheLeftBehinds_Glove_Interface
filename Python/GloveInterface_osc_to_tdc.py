from pythonosc import dispatcher
from pythonosc import osc_server
from pythonosc import osc_message_builder
from pythonosc import udp_client
import socket

DEBUGGING = False

esp32_ip = "192.168.1.100" # Static IP of the ESP32 device
esp32_receive_port = 8000  # Port that the ESP32 listens for handshake request
esp32_send_port = 8800     # Port where script listens for OSC messages from ESP32

# TCP Client details (Max/MSP)
max_host = '127.0.0.1'  # Localhost for Max/MSP
max_port = 12345        # Port Max/MSP is listening on

# Set up the TCP client for Max/MSP
max_client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
max_client_socket.connect((max_host, max_port))

# Create an OSC client to send handshake request to ESP32 on its receive port
client = udp_client.SimpleUDPClient(esp32_ip, esp32_receive_port)

# Function to send a handshake request to ESP32
def send_handshake_request():
    print("Sending handshake request to ESP32...")
    handshake_message = osc_message_builder.OscMessageBuilder(address="/request-handshake")
    handshake_message.add_arg("Request Handshake")
    client.send(handshake_message.build())
    print("Handshake request sent.")

# Function to handle incoming /handshake response from ESP32
def handle_handshake_response(address, *args):
    print("Received handshake response from ESP32.")

# Function to handle incoming /sensors messages
def handle_sensors(address, *args):
    if DEBUGGING :
        print(f"Received /sensors message: {args}")
    message = f"/sensors {' '.join(map(str, args))}"
    send_to_max(message)

# Function to send to Max/MSP via TDC
def send_to_max(data):
    try:
        max_client_socket.send((data + '\n').encode())
        if DEBUGGING :
            print(f"Sent to Max/MSP: {data}")
    except Exception as e:
        print(f"Error sending to Max/MSP: {e}")

# Function to setup and start the OSC server
def start_osc_server():
    # Create dispatcher and map the response handlers to the appropriate OSC addresses
    osc_dispatcher = dispatcher.Dispatcher()
    osc_dispatcher.map("/reply-handshake", handle_handshake_response)
    osc_dispatcher.map("/sensors", handle_sensors)

    # Start the OSC server, listening on port esp32_send_port
    server = osc_server.ThreadingOSCUDPServer(("0.0.0.0", esp32_send_port), osc_dispatcher)

    print(f"Listening for OSC messages on 0.0.0.0:{esp32_send_port}")

    # Send the handshake request immediately before starting the server
    send_handshake_request()

    # Start the server to listen indefinitely
    server.serve_forever()

# Main execution entry
if __name__ == "__main__":
    start_osc_server()
