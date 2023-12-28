import 'package:cake/cake.dart';

void main(List<String> arguments) async {
  TestRunnerDefault('Simple Test with no groups', [
    // Generic Constructor
    Test('True is true - assertion',
        assertions: (context) => [
              Expect(ExpectType.equals, expected: true, actual: true),
            ]),
    Test('True is true, set in setup',
        setup: (context) {
          context.expected = true;
          context.actual = true;
        },
        assertions: (test) => [
              Expect.equals(actual: test.expected, expected: test.actual),
            ]),
    Test('True is true, set in action',
        action: (context) {
          context.expected = true;
          context.actual = true;
        },
        assertions: (test) => [
              Expect.equals(actual: test.expected, expected: test.actual),
            ]),

    // Equals expect
    Test(
      'Equals, true is true',
      assertions: (context) => [Expect.equals(expected: true, actual: true)],
    ),

    // isNull expect
    Test('IsNull, null is null',
        action: (test) => null,
        assertions: (context) => [Expect.isNull(context.actual)]),

    // isNotNull expect
    Test('IsNotNull, true is not null',
        action: (test) => true,
        assertions: (context) => [Expect.isNotNull(context.actual)]),

    // isType expect
    Test('IsType, true is bool',
        action: (test) => true,
        assertions: (context) => [Expect<bool>.isType(context.actual)]),
    // isTrue expect
    Test('IsTrue, true is true',
        action: (test) => true,
        assertions: (test) => [Expect.isTrue(test.actual)]),
    // isFalse expect
    Test('IsFalse, false is false',
        action: (test) => false,
        assertions: (test) => [Expect.isFalse(test.actual)]),
    // Other
    Test('Action can accept return type',
        action: (test) => true,
        assertions: (test) =>
            [Expect.equals(actual: test.actual, expected: true)]),
  ]);
}
