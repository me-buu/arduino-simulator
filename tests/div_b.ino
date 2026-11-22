void setup() {
  Serial.begin(9600);
  int rpm = 3000;                 // ความเร็วรอบ (รอบ/นาที)
  int minutes = 20;               // เวลาเดินเครื่อง (นาที)
  int rev = rpm * minutes;        // จำนวนรอบทั้งหมด
  long revL = rpm * minutes;      // เก็บใน long
  long revOK = (long)rpm * minutes;
  Serial.println(rev);
  Serial.println(revL);
  Serial.println(revOK);
}

void loop() {
}
