import 'package:cake_flutter/cake_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_sample/main.dart';

void main() {
  FlutterTestRunner(
    'Counter',
    [
      Test(
        'Counter should start at zero',
        action: (test) => test.index(),
        assertions: (test) => [
          Expect.equals(actual: test.search.text('0').length, expected: 1),
          Expect.equals(actual: test.search.text('1').length, expected: 0),
        ],
      ),
      Test(
        'Counter should increment when + is tapped',
        action: (test) async {
          test.index();
          await test.search.icon(Icons.add).first.tap();
          await test.forward();
          test.index();
        },
        assertions: (test) => [
          Expect.equals(actual: test.search.text('0').length, expected: 0),
          Expect.equals(actual: test.search.text('1').length, expected: 1),
        ],
      ),
    ],
    setup: (test) async {
      await test.setApp(const MyApp());
    },
  );
}
