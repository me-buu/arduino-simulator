// เฉลยข้อ 5 ตัดเกรดด้วย switch-case
// คะแนนสำหรับทดสอบ
int scores[10] = {95, 80, 79, 65, 50, 49, 0, 100, 101, -5};

void printGrade(int score) {
  Serial.print(score);
  Serial.print(" -> ");
  if (score < 0 || score > 100) {      // ตรวจช่วงคะแนนก่อนเข้า switch
    Serial.println("Error");
    return;                            // จบฟังก์ชันทันที
  }
  switch (score / 10) {                // หารจำนวนเต็ม เช่น 79 / 10 = 7
    case 10:                           // คะแนน 100
    case 9:
    case 8:
      Serial.println("A");
      break;
    case 7:
      Serial.println("B");
      break;
    case 6:
      Serial.println("C");
      break;
    case 5:
      Serial.println("D");
      break;
    default:                           // 0 ถึง 49
      Serial.println("F");
      break;
  }
}

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 10; i++) {
    printGrade(scores[i]);
  }
}

void loop() {
}
