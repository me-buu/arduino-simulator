void setup() {
  Serial.begin(9600);
  int level = 0;                  // ระดับน้ำในถัง (cm)
  int seconds = 0;                // เวลาที่ผ่านไป (s)
  while (level < 20) {            // เติมจนกว่าน้ำจะถึง 20 cm
    level = level + 6;            // น้ำขึ้น 6 cm ทุกวินาที
    seconds++;
    Serial.println(level);
  }
  Serial.print("Time = ");
  Serial.println(seconds);
}

void loop() {
}
