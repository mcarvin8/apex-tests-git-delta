# Apex Tests Git Delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta) [![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)

The `apex-tests-git-delta` is a Salesforce CLI plugin to take 2 commit SHAs in a Salesforce DX git repository and return the delta Apex tests to run against when executing a delta deployment.

The tests are determined by looking at all commit messages in the commit range and extracting them with a regular expression defined in a config file.

You must add a config file named `.apextestsgitdeltarc` in the root folder of your repository with your regular expression.

For example, your `.apextestsgitdeltarc` file can contain the regular expression:

```
[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]
```

Commit messages that follow the above regular expression can look like below. The tests in the commit message expression can either be the local tests themselves or a Test Suite, if you have test suites retrieved into your repository. For example, if you have a test suite file named `SampleSuite.testSuite`, you should provide `SampleSuite` in the commit message epxression.

```
fix: required updates to account trigger and opportunity trigger handler Apex::AccountTriggerHandlerTest OpportunityTriggerHandlerTest::Apex
chore: add sandbox refresh class Apex::PrepareMySandboxTest::Apex
fix: fix quoting issues Apex::QuoteControllerTest::Apex
build: use a test suite Apex::SampleSuite::Apex
```

The 3 commit messages above will be parsed to retrieve all test classes/suites found using the regular expression. Test classes/suites can be separated by commas, spaces, or both in the commit message. This plugin will extract & separate all tests by a single space and sort them alphabetically when creating the final output.

```
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

The command's output is designed to be used with the Salesforce CLI (`sf`) deployment command. So when you want to deploy or validate Apex metadata, you can wrap this command with the deploy command to dynamically build the list of specified tests:

```
sf project deploy start -x package/package.xml -l RunSpecifiedTests -t $(sf apex-tests-git-delta delta --from "HEAD~1" --to "HEAD")
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

This command needs to be ran somewhere inside your Salesforce DX git repository, whether it's the root folder (recommended) or a subfolder.

This command will determine the root folder of the repo and look for the `sfdx-project.json` file in the root folder.

## `sf apex-tests-git-delta delta`

```
USAGE
  $ sf apex-tests-git-delta delta -f <value> -t <value> [--json]

FLAGS
  -f, --from=<value> Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.
  -t, --to=<value> [default: HEAD] Commit SHA to where the commit message log is done.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Given 2 git commits, this plugin will parse all of the commit messages between this range and return the delta Apex test class string. This can be used to execute delta deployments.

EXAMPLES
    $ sf apex-tests-git-delta delta --from "HEAD~1" --to "HEAD"
```
