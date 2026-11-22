const int BUTTON_PIN = 7;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON_PIN, INPUT);         // ลืมใส่ตัวต้านทาน
}

void loop() {
  int state = digitalRead(BUTTON_PIN);
  Serial.println(state);
  delay(300);
}
