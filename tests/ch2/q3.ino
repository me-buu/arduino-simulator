// เฉลยข้อ 3 ฟังก์ชันแปลงความเร็วรอบ (rpm) เป็นความเร็วเชิงมุม (rad/s)
float rpmToRadPerSec(float rpm) {
  return rpm * 2.0 * PI / 60.0;        // PI เป็นค่าคงที่ที่ Arduino กำหนดไว้ให้
}

void setup() {
  Serial.begin(9600);
  for (int rpm = 0; rpm <= 3000; rpm += 500) {
    Serial.print(rpm);
    Serial.print(" rpm = ");
    Serial.print(rpmToRadPerSec(rpm));
    Serial.println(" rad/s");
  }
}

void loop() {
}
