// เฉลยข้อ 2 พิมพ์เลขคู่ 2 ถึง 40 และผลรวม
void setup() {
  Serial.begin(9600);
  int sum = 0;                         // ผลรวม เริ่มจาก 0
  for (int n = 2; n <= 40; n += 2) {   // n = 2, 4, 6, ..., 40
    Serial.println(n);
    sum += n;                          // สะสมผลรวม
  }
  Serial.print("Sum = ");
  Serial.println(sum);                 // ได้ 420
}

void loop() {
}
