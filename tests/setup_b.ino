void setup() {
  Serial.begin(9600);
  Serial.println("Start");        // ทำครั้งเดียว
}

void loop() {
  int count = 0;                  // ประกาศไว้ใน loop()
  count++;
  Serial.print("loop ");
  Serial.println(count);
  delay(1000);
}
