# `apex-tests-git-delta`

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta)
[![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/00358247-0030-4cd2-b5c0-2b5553bdf0a6/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-tests-git-delta)
[![Code Coverage](https://qlty.sh/badges/00358247-0030-4cd2-b5c0-2b5553bdf0a6/test_coverage.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-tests-git-delta)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>

- [Install](#install)
- [System Dependencies](#system-dependencies)
- [Usage](#usage)
  - [Create a config file](#create-a-config-file)
  - [Use the format in commit messages](#use-the-format-in-commit-message)
  - [Run the command to extract tests](#run-the-command-to-extract-tests)
  - [Use the output in a deployment command](#use-the-output-in-a-deployment-command)
- [Why This Plugin?](#why-this-plugin)
- [Command](#command)
  - [`sf atgd delta`](#sf-atgd-delta)
- [Alternatives](#alternatives)
- [Issues](#issues)
- [License](#license)
</details>

A **Salesforce CLI plugin** that extracts Apex test class names from **git commit messages**, enabling **incremental test execution** during deployments.

This plugin helps you:

✅ Automate test selection based on commit history  
✅ Ensure critical tests run before deployment  
✅ Seamlessly integrate with `sfdx-git-delta`

## Install

```bash
sf plugins install apex-tests-git-delta@x.y.z
```

## System Dependencies

Requires [git](https://git-scm.com/downloads) to be installed and that it can be called using the command `git`.

## Usage

### Create a config file

Create a `.apextestsgitdeltarc` file in your **Salesforce DX project root** with the regular expression:

```regex
[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]
```

### Use the format in commit messages

```bash
fix: update triggers Apex::AccountTriggerHandlerTest OpportunityTriggerHandlerTest::Apex
chore: add sandbox setup Apex::PrepareMySandboxTest::Apex
fix: resolve quoting issues Apex::QuoteControllerTest::Apex
```

### Run the command to extract tests

```bash
sf atgd delta --from "HEAD~1" --to "HEAD"
```

✅ **Output (alphabetically sorted, space-separated test classes):**

```bash
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

### Use the output in a deployment command

```bash
sf project deploy start -x package/package.xml -l RunSpecifiedTests -t $(sf atgd delta --from "HEAD~1" --to "HEAD")
```

## Why This Plugin?

[sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta) is great for identifying changed Apex classes, but running only those modified tests may not be enough. Other dependencies or testing strategies may require additional tests.

This plugin lets you define which tests to run for each commit, ensuring better coverage. It seamlessly integrates with `sfdx-git-delta` using the same `--from` and `--to` SHA arguments.

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

## Alternatives

| Plugin                                                                | Approach                                       |
| --------------------------------------------------------------------- | ---------------------------------------------- |
| **apex-tests-git-delta**                                              | Extracts test classes from **commit messages** |
| **[sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta)**     | Run modified Apex classes                      |
| **[apex-test-list](https://github.com/renatoliveira/apex-test-list)** | Uses test annotations in Apex files            |

## Issues

If you encounter any issues or would like to suggest features, please create an [issue](https://github.com/mcarvin8/apex-tests-git-delta/issues).

## License

This project is licensed under the MIT license. Please see the [LICENSE](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md) file for details.
