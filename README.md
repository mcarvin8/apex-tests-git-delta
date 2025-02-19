# Apex Tests Git Delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta) [![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta) [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Usage](#usage)
- [Why This Plugin](#why-this-plugin)
- [Install](#install)
- [System Dependencies](#system-dependencies)
- [Command](#command)
  - [`sf atgd delta`](#sf-atgd-delta)
- [Alternative](#alternative)
- [Issues](#issues)
- [License](#license)
</details>

A Salesforce CLI plugin to determine Apex tests for incremental deployments using git commit messages.

## Usage

This plugin extracts test class names from commit messages using a regular expression defined in `.apextestsgitdeltarc` at the root of your Salesforce DX project.

Example `.apextestsgitdeltarc` file:

```
[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]
```

Example commit messages:

```
fix: update triggers Apex::AccountTriggerHandlerTest OpportunityTriggerHandlerTest::Apex
chore: add sandbox setup Apex::PrepareMySandboxTest::Apex
fix: resolve quoting issues Apex::QuoteControllerTest::Apex
```

Test classes can be separated by commas, spaces, or both in the commit messages. The final output is a space-separated, alphabetically sorted list:

```
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

These tests can then be used with the `RunSpecifiedTests` flag of the Salesforce CLI deploy command:

```
sf project deploy start -x package/package.xml -l RunSpecifiedTests -t $(sf atgd delta --from "HEAD~1" --to "HEAD")
```

By default, only test classes found in package directories (as listed in `sfdx-project.json` on the `--to` commit) will be included in the output. You can supply the `-v`/`--skip-test-validation` flag to skip the validation and ensure the output includes all tests found in the commit message as-is.

If no test classes are found in the commit messages, the output is empty, and a warning is printed, but the command does not fail.

## Why This Plugin

[sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta) is great for identifying changed Apex classes, but running only those modified tests may not be enough. Other dependencies or testing strategies may require additional tests.

This plugin lets you define which tests to run for each commit, ensuring better coverage. It seamlessly integrates with `sfdx-git-delta` using the same `--from` and `--to` SHA arguments.

## Install

```bash
sf plugins install apex-tests-git-delta@x.y.z
```

## System Dependencies

Requires [git](https://git-scm.com/downloads) to be installed and that it can be called using the command `git`.

## Command

- `sf atgd delta`

## `sf atgd delta`

```
USAGE
  $ sf atgd delta -f <value> -t <value> -v [--json]

FLAGS
  -f, --from=<value>          Commit SHA from where the commit message log is done.
                              This SHA's commit message will not be included in the results.
  -t, --to=<value>            Commit SHA to where the commit message log is done.
                              [default: HEAD]
  -v, --skip-test-validation  Skip validating that tests exist in the local package directories.
                              [default: false]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Parse commit messages over a range and return the Apex tests to deploy against.

EXAMPLES
  Get tests from the most recent commit, confirming they exist in the local package directories.

    $ sf atgd delta --from "HEAD~1" --to "HEAD"

  Get tests from the most recent commit, skipping the local package directory validation.

    $ sf atgd delta --from "HEAD~1" --to "HEAD" -v
```

## Alternative

[apex-test-list](https://github.com/renatoliveira/apex-test-list) is another plugin that can be used to determine Apex tests for incremental deployments. This plugin uses test annotations defined directly inside the Apex files to determine specified tests to run.

This plugin is a great tool for a more universal approach to determining specified tests to run when deploying to Salesforce orgs.

## Issues

If you encounter any issues, please create an issue in the [issue tracker](https://github.com/mcarvin8/apex-tests-git-delta/issues). Please also create issues to suggest any new features.

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md) file for details.
