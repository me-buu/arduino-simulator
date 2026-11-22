const int TMP_PIN = A2;

// อ่านแรงดันจาก TMP36 แล้วแปลงเป็นองศาเซลเซียส
float readTempC() {
  int adc = analogRead(TMP_PIN);
  float volt = adc * 5.0 / 1023.0;
  return (volt - 0.5) * 100.0;
}

void setup() {
  Serial.begin(9600);
}

void loop() {
  float t = readTempC();
  Serial.println(t);
  delay(1000);
}
