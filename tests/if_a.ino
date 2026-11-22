const int RED = 8;
const int YELLOW = 9;
const int GREEN = 10;

void setup() {
  pinMode(RED, OUTPUT);
  pinMode(YELLOW, OUTPUT);
  pinMode(GREEN, OUTPUT);
}

void loop() {
  // อ่านอุณหภูมิ 0 ถึง 100 °C จากเซนเซอร์ที่ขา A0
  int temp = map(analogRead(A0), 0, 1023, 0, 100);

  if (temp > 80) {
    digitalWrite(RED, HIGH);      // ร้อนเกิน
    digitalWrite(YELLOW, LOW);
    digitalWrite(GREEN, LOW);
  } else if (temp > 60) {
    digitalWrite(RED, LOW);
    digitalWrite(YELLOW, HIGH);   // อุ่น
    digitalWrite(GREEN, LOW);
  } else {
    digitalWrite(RED, LOW);
    digitalWrite(YELLOW, LOW);
    digitalWrite(GREEN, HIGH);    // ปกติ
  }
}
