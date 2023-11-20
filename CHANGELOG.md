# 1.1.0
- [META] Fix images so they appear correctly outside of github
- [META] Existing Cake files are no longer needed to use extension
- [ADD] Added snippets for Test Runner, Groups, Test, and Expects.

# 1.0.0
- [MOD] Updated detection to work with Cake v5.0.0. Cake v4 is not deprecated with this version, with one small exception.
- [ADD] Added support for (TestRunner/Group/Test)Of constructors.
- [BREAKING] Removed GroupDefault since that was deprecated in Cake v4 and removed in Cake v5. (You may safely remove the 'Default' part to work effectively.)
- [FIX] Better detection of class names. No more having 'Test' or 'Group' in the test title setting off false positives.
- [FIX] Lens icons and messages now appear where the test item begins, not where the title is declared.
- [CLEAN] Restructured some models and added comments for better readability.
- [FIX] Deleting or renaming a Cake file will now automatically update the test panel.
- [MOD] Should try to refresh test panel less often and only when a Cake file is modified.
- [ADD] Tests can be run from the file level from the test panel.
- [META] Updated license to MPL-2.0 to match the rest of Polyhedra projects.
- [ADD] Changed out placeholder icon.

# 0.1.0
- [MOD] Updated code to work with Cake 4.0.0 (previous versions are now deprecated)

# 0.0.5
- [FIX] Cleaned up output to not print ANSI colors as vscode messages don't know how to print these and just adds noise to the error message.

# 0.0.4
- [FIX] Fixed having to have a load-bearing test file in the root folder in order for extension to activate
- [META] Added a placeholder icon with some other meta improvements. How cute!
- [ADD] Debug mode! You can now click next to a test in the panel to debug a specific test, group, or test runner.

# 0.0.3
- [CLEAN] Trimmed down some redundant code internally
- [FIX] Fixed groups not running
- [FIX] Fixed children of groups not showing up under their group
- [FIX] Nested children groups and tests will now display passed/failed results correctly

# 0.0.2
- [CLEAN] Removed experimental APIs that were wholly unneeded anyways.

# 0.0.1
- Initial Release