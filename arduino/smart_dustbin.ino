#include <Servo.h>

Servo binServo;

// Configuration
const int SERVO_PIN = 9;
const int POS_CENTER = 90;
const int POS_BIO = 15;      
const int POS_NON_BIO = 165; 
const int DUMP_DELAY = 2000;  

void setup() {
  Serial.begin(9600);
  binServo.attach(SERVO_PIN);
  binServo.write(POS_CENTER);
  Serial.println("Smart Dustbin Ready.");
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();
    
    if (command == 'B') {
      // Biodegradable detected
      binServo.write(POS_BIO);
      delay(DUMP_DELAY);
      binServo.write(POS_CENTER); // Return to neutral
    } 
    else if (command == 'N') {
      // Non-Biodegradable detected
      binServo.write(POS_NON_BIO);
      delay(DUMP_DELAY);
      binServo.write(POS_CENTER); // Return to neutral
    }
    
    // Clear out any extra data in the buffer to prevent spamming
    while(Serial.available() > 0) {
      Serial.read();
    }
  }
}
