void setup() {
  Serial.begin(9600);
  int a = 12;
  int b = 5;
  int q = a / b;                  // หารจำนวนเต็ม
  int r = a % b;                  // เศษจากการหาร
  float f1 = a / b;               // หารก่อน แล้วจึงเก็บเป็น float
  float f2 = a / 5.0;             // มีเลขทศนิยมในการหาร
  Serial.println(q);
  Serial.println(r);
  Serial.println(f1);
  Serial.println(f2);
}

void loop() {
}
