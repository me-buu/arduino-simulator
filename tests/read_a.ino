const int BUTTON_PIN = 7;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);  // เปิดตัวต้านทาน pull-up ภายใน
}

void loop() {
  int state = digitalRead(BUTTON_PIN);
  Serial.println(state);
  delay(300);
}
