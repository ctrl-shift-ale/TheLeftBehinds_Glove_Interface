import socket
import time

# UDP settings
esp32_ip = "192.168.1.100"  # Replace with your ESP32's static IP
udp_ip = "0.0.0.0"  # Listen on all interfaces
udp_port = 4040  # Must match the ESP32's configuration

# Create UDP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((udp_ip, udp_port))

# Get the laptop's IP address
laptop_ip = socket.gethostbyname(socket.gethostname())
print(f"Laptop IP address: {laptop_ip}")

# Step 1: Send handshake to ESP32
handshake_message = f"HANDSHAKE:{laptop_ip}"
print(f"Sending handshake to ESP32: {handshake_message}")
sock.sendto(handshake_message.encode(), (esp32_ip, udp_port))
received = 0

try:
    while True:
        try:
            data, addr = sock.recvfrom(1024)
            print(f"Received response: {data.decode()} from {addr}")
            received += 1
            message = f"{time.time()}" 
            print(f"Sending message: {message}")
            sock.sendto(message.encode(), (esp32_ip, udp_port))
            received += 1

        except socket.timeout:
            print("No response received.")

except KeyboardInterrupt:
    print("\nStopping communication.")
    print(f"\n number of sent/received packages: {received}")
finally:
    sock.close()
