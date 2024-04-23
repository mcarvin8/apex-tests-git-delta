# Apex Tests Git Delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta) [![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)

The `apex-tests-git-delta` is a simple Salesforce CLI plugin to take 2 commit SHAs in a Salesforce Git repository and return the delta Apex tests to run against when executing a delta deployment.

This plugin requires [git](https://git-scm.com/downloads) to be installed and that it can be called using the command `git`.

The tests are determined by looking at all commit messages in the commit range and extracting them with a regular expression defined in a text file.

For example, if the user creates a file named `regex.txt` in their repository with the below regular expression, the plugin will extract all test classes that are found with this expression and return a space-separated string with unique test classes.

```
[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]
```

Commit messages that follow the above regular expression can look like:

```
fix: required updates to account trigger and opportunity trigger handler Apex::AccountTriggerHandlerTest OpportunityTriggerHandlerTest::Apex`
chore: add sandbox refresh class Apex::PrepareMySandboxTest::Apex`
fix: fix quoting issues Apex::QuoteControllerTest::Apex`
```

The 3 commit messages above will be parsed to retrieve all test classes found using the regular expression. Test classes can be separated by commas, spaces, or both in the commit message. This plugin will separate all tests by a single space and sort them alphabetically when creating the final output.

```
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

This plugin will also save its output to a text file, `runTests.txt` by default unless you provide a different file path via the `--output` flag.

You could then save the contents of this text file to a variable and use that variable in the `sf project deploy` command:

```
sf apex-tests-git-delta delta --from "c7603c25581afe7c443c57e687f2d6abd654ea77" --to "HEAD" --output "runTests.txt"
testclasses=$(<runTests.txt)
sf project deploy start -x manifest/package.xml -l RunSpecifiedTests -t $testclasses
```

**NOTE:** The test classes will only be added to the output if they are found in one of your package directories as listed in the `sfdx-project.json` in the `--to` commit's file-tree. If the test class name was not found in any package directory, a warning will be printed to the terminal. The plugin will not fail if no test classes are included in the final output. The output and text file will simply be empty if no delta test classes were found in any commit message or no test classes were validated against a package directory.

## Why another plugin to determine delta tests?

The [SFDX Git Delta](https://github.com/scolladon/sfdx-git-delta) is an amazing tool that generates packages and directories for delta deployments. It could also be used to generate a comma-separated list of added/modified Apex classes, which could be used to run only the tests which were modified.

However, depending on your testing strategy and other dependencies, running tests against only the Apex classes which changed may not be enough. You may need to declare additional Apex Tests to run against which will not be modified in this commit range.

This plugin will allow developers to control which tests are executed for each commit based on their testing strategies and dependencies.

## Install

```bash
sf plugins install apex-tests-git-delta@x.y.z
```

## Commands

The `apex-tests-git-delta` has 1 command:

- `sf apex-tests-git-delta delta`

Recommend running this command in your project's root directory.

## `sf apex-tests-git-delta delta`

```
USAGE
  $ sf apex-tests-git-delta delta -f <value> -t <value> -e <value> -c <value> --output <value> [--json]

FLAGS
  -f, --from=<value> Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.
  -t, --to=<value> [default: HEAD] Commit SHA to where the commit message log is done.
  -e, --regular-expression=<value> [default: regex.txt] The text file containing the Apex Tests regular expression to search for.
  -c, --sfdx-configuration=<value> [default: sfdx-project.json] Path to your project's Salesforce DX configuration file.
  --output=<value> [default: runTests.txt] The text file to save the delta test classes to.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Given 2 git commits, this plugin will parse all of the commit messages between this range and return the delta Apex test class string. This can be used to execute delta deployments.

EXAMPLES
    $ sf apex-tests-git-delta delta --from "c7603c255" --to "HEAD" --regular-expression "regex.txt" --sfdx-configuration "sfdx-project.json" --output "runTests.txt"
```
