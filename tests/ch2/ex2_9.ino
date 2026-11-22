// ตัวอย่างที่ 2.9 อาร์เรย์เก็บค่าที่วัดได้ แล้วหาค่าเฉลี่ย
float temps[5] = {25.1, 25.4, 24.9, 25.0, 25.6};   // อุณหภูมิ 5 ครั้ง (°C)

void setup() {
  Serial.begin(9600);
  float sum = 0;
  for (int i = 0; i < 5; i++) {   // ดัชนี i = 0, 1, 2, 3, 4
    sum += temps[i];              // เท่ากับ sum = sum + temps[i]
  }
  Serial.print("Average = ");
  Serial.println(sum / 5);
}

void loop() {
}
