const int A_PIN = 6;     // สวิตช์ A
const int B_PIN = 7;     // สวิตช์ B
const int LED_PIN = 8;

void setup() {
  pinMode(A_PIN, INPUT);
  pinMode(B_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool a = digitalRead(A_PIN) == HIGH;
  bool b = digitalRead(B_PIN) == HIGH;

  if (a && b) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}
