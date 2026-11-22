// ตัวอย่างที่ 2.2 ตัวแปรและค่าคงที่
const float GEAR_RATIO = 3.5;    // ค่าคงที่: อัตราทดของชุดเฟือง
int motorRpm = 1750;             // ความเร็วรอบมอเตอร์ (รอบ/นาที)
bool isRunning = true;           // สถานะของเครื่อง

void setup() {
  Serial.begin(9600);
  float outputRpm = motorRpm / GEAR_RATIO;   // ความเร็วรอบเพลาขาออก
  Serial.print("Output speed = ");
  Serial.print(outputRpm);       // float พิมพ์ทศนิยม 2 ตำแหน่ง
  Serial.println(" rpm");
  Serial.println(isRunning);     // bool พิมพ์เป็น 1 (จริง) หรือ 0 (เท็จ)
}

void loop() {
}
