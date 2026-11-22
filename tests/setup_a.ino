int count = 0;                    // ตัวแปรส่วนกลาง ค่าคงอยู่ข้ามรอบ

void setup() {
  Serial.begin(9600);
  Serial.println("Start");        // ทำครั้งเดียว
}

void loop() {
  count++;
  Serial.print("loop ");
  Serial.println(count);
  delay(1000);
}
