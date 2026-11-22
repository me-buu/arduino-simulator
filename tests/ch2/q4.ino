// โจทย์ข้อ 4 ให้ทำนายผลลัพธ์ก่อนรันจริง
void setup() {
  Serial.begin(9600);
  int a = 511;
  int b = 512;
  int c = 514;
  int avg1 = (a + b + c) / 3;
  float avg2 = (a + b + c) / 3;
  float avg3 = (a + b + c) / 3.0;
  Serial.println(avg1);
  Serial.println(avg2);
  Serial.println(avg3);
}

void loop() {
}
