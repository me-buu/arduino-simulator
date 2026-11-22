// ตัวอย่างที่ 4.1 อ่านค่า potentiometer ที่ขา A0 แล้วแปลงเป็นแรงดัน
const int POT_PIN = A0;

void setup() {
  Serial.begin(9600);               // ขาอนาล็อกไม่ต้องใช้ pinMode()
}

void loop() {
  int adc = analogRead(POT_PIN);    // ได้ค่า 0 ถึง 1023
  float volt = adc * 5 / 1023;      // ลืมใส่ .0
  Serial.print("ADC = ");
  Serial.print(adc);
  Serial.print("   V = ");
  Serial.println(volt);
  delay(500);
}
