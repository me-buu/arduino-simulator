// ตัวอย่างที่ 2.6 เลือกโหมดการทำงานด้วย switch-case
void setup() {
  Serial.begin(9600);
  int mode = 2;                   // 1 = เดินเครื่อง, 2 = หยุดชั่วคราว, 3 = บำรุงรักษา

  switch (mode) {
    case 1:
      Serial.println("RUN");
      break;                      // ออกจาก switch
    case 2:
      Serial.println("PAUSE");
      break;
    case 3:
      Serial.println("MAINTENANCE");
      break;
    default:                      // ค่าที่ไม่ตรงกับ case ใดเลย
      Serial.println("UNKNOWN MODE");
      break;
  }
}

void loop() {
}
