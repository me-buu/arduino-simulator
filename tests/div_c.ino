void setup() {
  Serial.begin(9600);
  int a = 511;                    // ค่าที่อ่านจากเซนเซอร์ 3 ครั้ง
  int b = 512;
  int c = 514;
  float avg = (a + b + c) / 3;    // ค่าเฉลี่ย
  Serial.println(avg);
}

void loop() {
}
