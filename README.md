# TheLeftBehinds_Glove_Interface
ANDROID GLOVE INSTRUCTIONS - THE LEFT BEHINDS

Pre-Show 

1. Charge the Battery: Ensure the battery has enough charge to power the control unit for the duration of the show (a fully charged battery should last for two shows).  After charging, unplug the battery from the ESP-32 to prevent unnecessary power usage.

2. Connect the Battery to the ESP-32:
Plug the battery into the ESP-32 microcontroller.

Attention: Ensure the red wire connects to red and the black wire connects to black.

3. Power On the ESP-32: The ESP-32 powers on automatically when connected to the battery (no on/off switch).

4. Network Connection:
The ESP-32 will attempt to connect to the TheLeftBehinds Wi-Fi network. During this process:

Red LED flashing: Attempting to connect.
Green LED flashing: Successfully connected.

If unable to connect within a few minutes, the ESP-32 will enter hibernate mode (see Step 8). This has been designed on purpose to allow the control unit to save energy if it’s not inside the Wi-Fi reception range when it’s turned on.


5. Actor Preparation:
Place the arm band on the actor.
Secure the glove on the actor’s hand.

6. Secure the Control Unit:
Close the lid of the control unit and secure it with tape.
Place the control unit into the arm band pocket, ensuring it is secure and the band’s Velcro does not interfere with the control unit plug.

7. Attach the Glove:
Connect the glove to the control unit using the ribbon cable.

8. Hibernate Mode (if applicable):
While in hibernate mode, the ESP-32 minimizes power usage and periodically attempts to reconnect to the network. If it manages, it will then leave Hibernate mode. If it fails, it will return to hibernation. Upon successful connection, proceed to Step 12.

9.Network Handshake:
Once the ESP-32 connects to the network, it waits for a handshake request from the laptop.

10. Laptop Setup:
Ensure Visual Studio Code and Ableton Live are running on the laptop with the correct Live Set loaded.
In Visual Studio Code, run the script GloveInterface_osc_to_tdc.py (click the “Play” button in the top-right corner). A new terminal window should open.

11. Verify Connection:
Check for blue LED flashing on the control unit.
and/or
Check the terminal for confirmation messages that the laptop and ESP-32 have successfully communicated.

Verify the Max for Live plugin is receiving data from the ESP-32.

During the Show

1. Monitor Battery Level:
Check the control unit’s battery level using the Live plugin. If the battery is low, consider switching to power-save or idle mode when the glove is not in use.
Note: Transitioning from idle mode to normal or power-save mode takes approximately 30 seconds.

2. Monitor Data Reception:
Use the Live plugin to ensure the data receiver monitor is not red. A red status indicates either loss of connection to the Wi-Fi network or that the ESP-32 has turned off for any reason.
Note: If the ESP-32 loses the connection fo the Wi-Fi, it will then try to re-establish it until it’s back online.


Troubleshooting:
If the ESP-32  fails to reconnect to Wi-Fi, press its reset button.
You might want to switch the ESP-32 to idle mode from the Live plugin during parts of the show where the glove is not in use to conserve battery.

After the Show

1. Disconnect Devices:
Unplug the glove and control unit.
Unplug the battery from the ESP-32.

2. Damage Check:
The glove connector, the control unit connector, and the ribbon cable are the components most exposed to kinetic damage.

3. Recharge the Battery:
Ensure the battery has enough charge to power the control unit for the duration of the next show (a fully charged battery should last for two shows).

Additional Resources
GitHub Repository: [TheLeftBehinds Glove Interface](https://github.com/ctrl-shift-ale/TheLeftBehinds_Glove_Interface)
Extra documentation: [TheLeftBehinds pdf instructions and video tutorial](https://drive.google.com/drive/folders/1V8O81qUjVRtdlBrQYh48ZpxaitHpn6vj?usp=sharing)
Contact: alessandro_quaranta@hotmail.com

