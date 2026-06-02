# apex-tests-git-delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta)
[![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/00358247-0030-4cd2-b5c0-2b5553bdf0a6/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-tests-git-delta)
[![codecov](https://codecov.io/gh/mcarvin8/apex-tests-git-delta/graph/badge.svg?token=26XDGPXWUE)](https://codecov.io/gh/mcarvin8/apex-tests-git-delta)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fapex-tests-git-delta%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/apex-tests-git-delta/main)

A Salesforce CLI plugin that extracts Apex test class names from git commit messages for incremental test execution during deployments.

- [Why This Plugin?](#why-this-plugin)
- [Install](#install)
- [Usage](#usage)
  - [Create a config file](#create-a-config-file)
  - [Use the format in commit messages](#use-the-format-in-commit-messages)
  - [Run the command to extract tests](#run-the-command-to-extract-tests)
  - [Use the output in a deployment command](#use-the-output-in-a-deployment-command)
- [`sf atgd delta`](#sf-atgd-delta)
- [Alternatives](#alternatives)
- [Issues](#issues)
- [License](#license)

## Why This Plugin?

[sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta) identifies changed Apex classes but running only those modified tests may not cover all required tests. This plugin lets you declare which tests belong to each commit directly in the commit message, giving you explicit control over test selection. It uses the same `--from` / `--to` SHA arguments as `sfdx-git-delta`, so the two tools compose naturally.

## Install

```bash
sf plugins install apex-tests-git-delta
```

Requires [git](https://git-scm.com/downloads) installed and available on `PATH`.

## Usage

### Create a config file

Create a `.apextestsgitdeltarc` file in your Salesforce DX project root. The file accepts up to two non-empty lines:

- **Line 1 (required):** regular expression to capture individual Apex test class names.
- **Line 2 (optional):** regular expression to capture [Apex Test Suite](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_apextestsuite.htm) names. Each matched suite name is resolved at the `--to` commit as `<suiteName>.testSuite-meta.xml` inside your `sfdx-project.json` package directories, and its `<testClassName>` entries are merged into the output.

```
[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]
[Ss][Uu][Ii][Tt][Ee]::(.*?)::[Ss][Uu][Ii][Tt][Ee]
```

Omitting line 2 disables suite parsing and is fully backward compatible.

### Use the format in commit messages

```bash
fix: update triggers Apex::AccountTriggerHandlerTest OpportunityTriggerHandlerTest::Apex
chore: add sandbox setup Apex::PrepareMySandboxTest::Apex
fix: resolve quoting issues Apex::QuoteControllerTest::Apex
chore: regression pass Suite::AccountRegressionSuite::Suite
```

#### Apex Test Suite wildcards

The plugin supports the same `<testClassName>` wildcard conventions [documented by Salesforce for ApexTestSuite metadata](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_apextestsuite.htm):

| `<testClassName>` entry          | Resolution at `--to`                                                            |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `LocalTestClass`                 | Literal local class. Validated like any class name from a commit message.       |
| `A*Class`, `*Test`, `Foo_*`      | Local wildcard. Expanded against all `.cls` files in your package directories.  |
| `*`                              | Expands to every local Apex class at `--to`.                                    |
| `Namespace1.NamespacedTestClass` | Managed-package test. Passed through as-is (not validated).                     |
| `Namespace1.*`                   | Managed-package wildcard. Passed through as-is; Salesforce resolves at runtime. |

Wildcard patterns that match nothing locally produce a warning and contribute no tests.

### Run the command to extract tests

```bash
sf atgd delta --from "HEAD~1" --to "HEAD"
```

Output is alphabetically sorted and space-separated:

```
AccountTriggerHandlerTest OpportunityTriggerHandlerTest PrepareMySandboxTest QuoteControllerTest
```

### Use the output in a deployment command

```bash
sf project deploy start -x package/package.xml -l RunSpecifiedTests -t $(sf atgd delta --from "HEAD~1" --to "HEAD")
```

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

Report bugs or suggest features by creating an [issue](https://github.com/mcarvin8/apex-tests-git-delta/issues).

## License

[MIT](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)
