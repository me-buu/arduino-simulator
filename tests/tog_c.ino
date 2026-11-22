const int BUTTON_PIN = 7;
const int LED_PIN = 8;
bool ledOn = false;               // สถานะของ LED
int lastState = HIGH;             // สถานะปุ่มรอบก่อน

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int state = digitalRead(BUTTON_PIN);
  if (lastState == HIGH && state == LOW) {   // เพิ่งกดลง
    ledOn = !ledOn;               // สลับสถานะ
    digitalWrite(LED_PIN, ledOn);
  }
}
