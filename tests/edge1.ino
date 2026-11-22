int g = 32767;
unsigned int u = 65535;
long big = 2147483647;
float f = 1.0 / 3.0;
byte b = 250;
void setup() {
  Serial.begin(9600);
  g++; Serial.println(g);
  u++; Serial.println(u);
  big++; Serial.println(big);
  Serial.println(f, 4);
  Serial.println(f, 0);
  Serial.println(-7 / 2);
  Serial.println(-7 % 2);
  Serial.println(7 % -2);
  b += 10; Serial.println(b);
  int x = 300 * 300; Serial.println(x);
  long y = 300L * 300; Serial.println(y);
  unsigned long z = 4000000000UL; Serial.println(z);
  Serial.println(100000);
  float h = 2.675; Serial.println(h);
  Serial.println(h, 3);
  Serial.println(-0.005);
  Serial.println(1e6);
  Serial.println(123456.789);
  int c = 3.99; Serial.println(c);
  int d = -3.99; Serial.println(d);
  bool e = 0.5; Serial.println(e);
  Serial.println((int)2.7 + 1);
  Serial.println(10 > 3 ? 1 : 2);
  int k = 0;
  for (int i = 0; i < 10; i++) { if (i == 2) continue; if (i == 6) break; k += i; }
  Serial.println(k);
  int w = 0; do { w += 3; } while (w < 10); Serial.println(w);
  int s = 2;
  switch (s) { case 1: Serial.println("one"); case 2: Serial.println("two"); case 3: Serial.println("three"); break; default: Serial.println("d"); }
  Serial.println(map(512, 0, 1023, 20, 80));
  Serial.println(map(100, 0, 1023, 100, -100));
  Serial.println(map(-5, 0, 10, 0, 100));
  Serial.println(5 / 2 * 2.0);
  Serial.println(5 / 2.0 * 2);
  char ch = 'A'; Serial.println(ch); Serial.println(ch + 1);
  Serial.println(255, 16); Serial.println(5, 2);
  unsigned int uu = 0; uu--; Serial.println(uu);
  int neg = -1; unsigned int un = 1; Serial.println(neg < un);
  Serial.println(abs(-5)); Serial.println(constrain(150, 0, 100)); Serial.println(min(3, 9));
  float q = 0.1 + 0.2; Serial.println(q, 6);
  Serial.println(sqrt(2), 5);
  Serial.println(1 << 10); Serial.println(1024 >> 3); Serial.println(6 & 3); Serial.println(6 | 3); Serial.println(6 ^ 3);
  Serial.println(true + true);
  Serial.println(PI, 4);
}
void loop() {
}
