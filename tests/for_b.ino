void setup() {
  Serial.begin(9600);
  int sum = 0;                    // ผลรวม เริ่มจาก 0
  for (int i = 1; i < 4; i++) {
    sum = sum + i;                // บวก i เข้าไปในผลรวม
    Serial.println(sum);
  }
  Serial.print("Sum = ");
  Serial.println(sum);
}

void loop() {
}
