const int SENSOR_PIN = 2;         // ปุ่มแทนสวิตช์ตรวจชิ้นงาน
int count = 0;
int lastState = HIGH;

void setup() {
  Serial.begin(9600);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
}

void loop() {
  int state = digitalRead(SENSOR_PIN);
  if (lastState == HIGH && state == LOW) {
    count++;
    Serial.print("Count = ");
    Serial.println(count);
  }
  lastState = state;
  delay(1000);                    // งานอื่นที่ใช้เวลานาน
}
