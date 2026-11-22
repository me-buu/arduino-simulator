// เฉลยข้อ 6 ตรวจขนาดเส้นผ่านศูนย์กลางเพลา 20.00 ± 0.05 mm
// ค่าที่วัดได้ (mm)
float d[8] = {20.02, 19.97, 20.06, 20.00, 19.94, 20.04, 20.01, 19.96};

void setup() {
  Serial.begin(9600);
  int passCount = 0;                   // จำนวนชิ้นที่ผ่าน
  float dMax = d[0];                   // เริ่มจากค่าแรก
  float dMin = d[0];

  for (int i = 0; i < 8; i++) {
    Serial.print(d[i]);
    if (d[i] >= 19.95 && d[i] <= 20.05) {   // อยู่ในช่วงพิกัดความเผื่อ
      Serial.println(" PASS");
      passCount++;
    } else {
      Serial.println(" FAIL");
    }
    if (d[i] > dMax) dMax = d[i];      // ปรับค่ามากที่สุด
    if (d[i] < dMin) dMin = d[i];      // ปรับค่าน้อยที่สุด
  }
  Serial.print("Pass = ");
  Serial.println(passCount);
  Serial.print("Max = ");
  Serial.println(dMax);
  Serial.print("Min = ");
  Serial.println(dMin);
}

void loop() {
}
