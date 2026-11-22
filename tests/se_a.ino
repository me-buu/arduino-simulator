// ตัวอย่างที่ 5.1 วัดระยะทางด้วยเซนเซอร์อัลตราโซนิก HC-SR04
const int TRIG_PIN = 6;
const int ECHO_PIN = 7;

// ส่งพัลส์กระตุ้นแล้วคืนค่าระยะทาง (cm) ถ้าไม่มีเสียงสะท้อนจะคืนค่า 0
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);          // พัลส์กระตุ้นกว้าง 10 µs
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  // เวลาที่ขา Echo เป็น HIGH (µs) รอไม่เกิน 30000 µs
  unsigned long t = pulseIn(ECHO_PIN, HIGH, 30000);
  return t * 0.0343 / 2.0;               // เสียงเดินทาง 0.0343 cm/µs หาร 2 เพราะไปและกลับ
}

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  float d = readDistanceCm();
  if (d == 0) {
    Serial.println("No echo");           // ไม่พบวัตถุในระยะ
  } else {
    Serial.print("Distance = ");
    Serial.print(d);
    Serial.println(" cm");
  }
  delay(500);
}
