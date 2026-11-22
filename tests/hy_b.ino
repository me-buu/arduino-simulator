// เฉลยข้อ 6 ไฟอัตโนมัติแบบมีฮิสเทอรีซิส ติดเมื่อ < 300 ดับเมื่อ > 400
const int LDR_PIN = A1;
const int LED_PIN = 8;
const int ON_LEVEL = 300;
const int OFF_LEVEL = 400;
bool lampOn = false;                // สถานะไฟปัจจุบัน

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(LDR_PIN);
  if (light < ON_LEVEL) {
    lampOn = true;                  // มืดพอ เปิดไฟ
  } else if (light > OFF_LEVEL) {
    lampOn = false;                 // สว่างพอ ปิดไฟ
  }                                 // ระหว่าง 300 ถึง 400 คงสถานะเดิม
  digitalWrite(LED_PIN, lampOn);
  Serial.println(light);
  delay(200);
}
