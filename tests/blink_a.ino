void setup() {
  pinMode(LED_BUILTIN, OUTPUT);       // ขา 13 เป็นเอาต์พุต
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);    // ไฟติด
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);     // ไฟดับ
  delay(500);
}
