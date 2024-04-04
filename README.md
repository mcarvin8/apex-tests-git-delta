# Apex Tests Git Delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta) [![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)

The `apex-tests-git-delta` is a simple Salesforce CLI plugin to take 2 commit SHAs in a Salesforce Git repository and return the delta Apex tests to run against when executing a delta deployment.

This plugin requires Git Bash to be installed in your environment.

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

The 3 commit messages above will be parsed and the plugin will return the following space-separated string, sorted alphabetically:

```
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

You could then pass the plugin's output to the `sf project deploy` command:

```
testclasses=$(sf apex-tests-git-delta delta --from "sha_hash" --to "sha_hash")

sf project deploy start -x manifest/package.xml -l RunSpecifiedTests -t $testclasses
```

## Why another plugin to determine delta tests?

The [SFDX Git Delta ](https://github.com/scolladon/sfdx-git-delta) is an amazing tool that generates packages and directories for delta deployments. It could also be used to generate a comma-separated list of added/modified Apex classes, which could be used to run only the tests which were modified.

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
  $ sf apex-tests-git-delta -f <value> -t <value> -e <value> [--json]

FLAGS
  -f, --from=<value> Git commit SHA from where the commit message log is done. This SHA's commit message will be included in the results.
  -t, --to=<value> Git commit SHA to where the commit message log is done. [default: HEAD]
  -e, --regular-expression=<value> [default: 'sfdx-project.json' in the current working directory] The path to your Salesforce DX configuration file, 'sfdx-project.json'.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Given 2 git commits, this plugin will parse all of the commit messages between this range, including the '--from' commit, and return the delta Apex test class string. This can be used to execute delta deployments.

EXAMPLES
    $ sf apex-tests-git-delta --from "abcdef" --to "ghifb" --regular-expression "regex.txt"
```
