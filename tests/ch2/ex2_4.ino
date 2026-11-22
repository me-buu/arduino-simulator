// ตัวอย่างที่ 2.4 การหารจำนวนเต็ม
void setup() {
  Serial.begin(9600);
  int a = 12;
  int b = 5;
  Serial.println(a / b);          // หารจำนวนเต็ม ได้ 2 (ตัดเศษทิ้ง)
  Serial.println(a % b);          // เศษจากการหาร ได้ 2
  Serial.println(a / 5.0);        // มีเลขทศนิยมในนิพจน์ ได้ 2.40
  Serial.println((float)a / b);   // แปลง a เป็น float ก่อนหาร ได้ 2.40
}

void loop() {
}
