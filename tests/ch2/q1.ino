// เฉลยข้อ 1 พิมพ์เลข 0 ถึง 20 บรรทัดละ 1 ตัว
void setup() {
  Serial.begin(9600);
  for (int i = 0; i <= 20; i++) {
    Serial.println(i);
  }
}

void loop() {
}
