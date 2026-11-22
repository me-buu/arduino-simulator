// ตัวอย่างที่ 2.7 ตารางแปลงความดันจาก bar เป็น psi ด้วย for
void setup() {
  Serial.begin(9600);
  for (int bar = 0; bar <= 10; bar = bar + 2) {   // bar = 0, 2, 4, ..., 10
    float psi = bar * 14.504;                     // 1 bar = 14.504 psi
    Serial.print(bar);
    Serial.print(" bar = ");
    Serial.print(psi);
    Serial.println(" psi");
  }
}

void loop() {
}
