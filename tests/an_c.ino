// ตัวอย่างที่ 4.2 อ่านค่าความสว่างจาก photoresistor ที่ขา A1
const int LDR_PIN = A1;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int light = analogRead(LDR_PIN);  // สว่างมาก = ค่ามาก (photoresistor อยู่ฝั่ง 5V)
  Serial.print("Light = ");
  Serial.println(light);
  delay(500);
}
