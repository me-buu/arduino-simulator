const int TRIG_PIN = 6;
const int ECHO_PIN = 7;
const int RED_PIN = 8;
const int YELLOW_PIN = 9;
const int GREEN_PIN = 10;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long t = pulseIn(ECHO_PIN, HIGH, 30000);
  return t * 0.0343 / 2.0;
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
}

void loop() {
  float d = readDistanceCm();
  digitalWrite(RED_PIN, d <= 15);                 // ใกล้มาก
  digitalWrite(YELLOW_PIN, d > 15 && d <= 50);    // ระวัง
  digitalWrite(GREEN_PIN, d > 50);                // ปลอดภัย
  delay(200);
}
