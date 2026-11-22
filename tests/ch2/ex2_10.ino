// ตัวอย่างที่ 2.10 ฟังก์ชันแปลงองศาเซลเซียสเป็นองศาฟาเรนไฮต์
float celsiusToF(float c) {
  return c * 9.0 / 5.0 + 32.0;    // ส่งผลลัพธ์กลับไปยังผู้เรียกใช้
}

void setup() {
  Serial.begin(9600);
  Serial.println(celsiusToF(100.0));   // ได้ 212.00
  Serial.println(celsiusToF(25.0));    // ได้ 77.00
}

void loop() {
}
