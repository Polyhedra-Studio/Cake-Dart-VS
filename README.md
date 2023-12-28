<div align="center">
    <img src="https://github.com/Polyhedra-Studio/Cake-Dart-VS/blob/main/images/cake_logo.png?raw=true" alt="Cake Tester Logo" width="128" />
    <h1> Cake Test Runner for Visual Studio Code</h1>
    <p><a href="https://github.com/Polyhedra-Studio/Cake" _target="blank">Learn more about Cake, the lightweight, explicit testing framework for Dart & Flutter.</a></p>
</div>

## Getting started

- Get the extension within [VS Code](https://code.visualstudio.com), or download from the Open VSX Registry or Visual Studio Marketplace.

- Include Cake/Cake_Flutter in your `pubspec.yaml` file under dev dependencies or install by running
    - Dart: `dart pub install dev:cake`
    - Flutter: `flutter pub install dev:cake_flutter`
- Open the Test Explorer in VS Code or open a Cake test file (any file ending with .cake.dart) to run.

## Requirements

- [VS Code](https://code.visualstudio.com) version 1.68.1 and above.
- [Dart 2.17](https://dart.dev/get-dart) and above.
Dart only:
- [Cake v4.0](https://pub.dev/packages/cake) and above.
Date + Flutter:
- [Cake v6.0](https://pub.dev/packages/cake) and above.
- [Cake Flutter v0.3.2](https://pub.dev/packages/cake_flutter) and above.

## Features

### Run or Debug Tests within Test Explorer or in code

You can run or debug files, Test Runners, Groups, or Tests directly from the code or in The Test Explorer in VS Code.

<div align="center">
    <img src="https://github.com/Polyhedra-Studio/Cake-Dart-VS/blob/main/images/demo.gif?raw=true" alt="Test Explorer demo in VS Code" />
</div>

### Snippets

- General
    - `cake-runner` - Cake Test File without Context.
    - `cake-runner-context` - Cake Test File with Context.
    - `cake-group` - A group stub.
    - `cake-test` - A test with action and assertions.
- Flutter
    - `cake-flutter` - Cake Test File for Flutter.

- Expects
    - General
        - `cake-ex-eq` - Equals Expect.
        - `cake-ex-ne` - Not Equals Expect.
        - `cake-ex-t` - Is True Expect.
        - `cake-ex-f` - Is False Expect.
        - `cake-ex-n` - Is Null Expect.
        - `cake-ex-nn` - Is Not Null Expect.
        - `cake-ex-type` - Is Type Expect.
    - Flutter
        - `cake-ex-wtype` - Is Widget Type Expect.
        - `cake-ex-find` - Find Match Expect.
        - `cake-ex-find-ln` - Finds At Least N Widgets Match Expect.
        - `cake-ex-find-n` - Finds N Widgets Match Expect.
        - `cake-ex-find-no` - Finds Nothing Match Expect.
        - `cake-ex-find-o` - Finds One Widget Match Expect.
        - `cake-ex-find-w` - Finds Widgets Match Expect.

## Feedback

If you discover a bug or have a suggestion, please check [Issues](https://github.com/Polyhedra-Studio/Cake-Dart-VS/issues) page. If someone has already submitted your bug/suggestion, please upvote so it can get better visibility.

## License
This extension is licensed under [Mozilla Public License, 2.0](https://www.mozilla.org/en-US/MPL/).