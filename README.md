# apex-tests-git-delta

[![NPM](https://img.shields.io/npm/v/apex-tests-git-delta.svg?label=apex-tests-git-delta)](https://www.npmjs.com/package/apex-tests-git-delta)
[![Downloads/week](https://img.shields.io/npm/dw/apex-tests-git-delta.svg)](https://npmjs.org/package/apex-tests-git-delta)
[![GitHub Marketplace](https://img.shields.io/badge/marketplace-apex--tests--git--delta-blue?logo=github)](https://github.com/marketplace/actions/apex-tests-git-delta)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://raw.githubusercontent.com/mcarvin8/apex-tests-git-delta/main/LICENSE.md)
[![Maintainability](https://qlty.sh/badges/00358247-0030-4cd2-b5c0-2b5553bdf0a6/maintainability.svg)](https://qlty.sh/gh/mcarvin8/projects/apex-tests-git-delta)
[![codecov](https://codecov.io/gh/mcarvin8/apex-tests-git-delta/graph/badge.svg?token=26XDGPXWUE)](https://codecov.io/gh/mcarvin8/apex-tests-git-delta)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmcarvin8%2Fapex-tests-git-delta%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/mcarvin8/apex-tests-git-delta/main)

Identify Apex test classes for incremental Salesforce deployments by parsing git commit messages. Available as a **Salesforce CLI plugin** for any provider, and as a **native GitHub Action** for GitHub Actions users who want to skip installing the CLI.

- [Why This Plugin?](#why-this-plugin)
- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Command](#command)
- [GitHub Action](#github-action)
- [Output Formats](#output-formats)
- [Alternatives](#alternatives)
- [Issues](#issues)
- [License](#license)

## Why This Plugin?

[sfdx-git-delta](https://github.com/scolladon/sfdx-git-delta) identifies changed Apex classes but running only those modified tests may not cover all required tests. This plugin lets you declare which tests belong to each commit directly in the commit message, giving you explicit control over test selection. It uses the same `--from` / `--to` SHA arguments as `sfdx-git-delta`, so the two tools compose naturally.

## Requirements

- Salesforce CLI (`sf`)
- Node.js **22.22 or later**
- No git binary required - git operations are handled entirely in TypeScript

## Install

```bash
sf plugins install apex-tests-git-delta
```

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

Use the default `space` format with a single `--tests` flag (or `-t`) that you supply with the CLI command (which accepts a space-separated list):

```bash
sf project deploy start -x package/package.xml -l RunSpecifiedTests --tests $(sf atgd delta --from "HEAD~1" --to "HEAD")
```

Use the `sf` format to inline tests directly into commands that expect repeated `--tests` flags (e.g. `sf apex run test`):

```bash
sf apex run test $(sf atgd delta --from "HEAD~1" --to "HEAD" --format sf)
# expands to: sf apex run test --tests AccountTriggerHandlerTest --tests QuoteControllerTest ...
```

## Command

<!-- commands -->
* [`sf atgd delta`](#sf-atgd-delta)

## `sf atgd delta`

Determine Apex tests by parsing commit messages.

```
USAGE
  $ sf atgd delta -t <value> -f <value> -v [--json] [--flags-dir <value>] [-m] [-o space|sf]

FLAGS
  -f, --from=<value>          (required) Commit SHA from where the commit message log is done. This SHA's commit message
                              will not be included in the results.
  -m, --merge-base            Resolve `--from` as the merge base of `--to` and `--from` (e.g. `--to develop --from main
                              --merge-base`), resolved in-process with no local git binary required.
  -o, --format=<option>       [default: space] Output format for the test list. "space" (default) outputs a
                              space-separated list. "sf" outputs each test prefixed with --tests for use in Salesforce
                              CLI commands (e.g. --tests ClassA --tests ClassB).
                              <options: space|sf>
  -t, --to=<value>            (required) [default: HEAD] Commit SHA to where the commit message log is done.
  -v, --skip-test-validation  (required) Skip validating that tests exist in the local package directories.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Determine Apex tests by parsing commit messages.

  Determine Apex tests for incremental deployments by parsing commit messages between 2 commits. Commit messages may
  reference individual Apex test classes (e.g. `Apex::MyTest::Apex`) or Apex Test Suites (e.g.
  `Suite::MyTestSuite::Suite`) when a suite regex is configured on the 2nd line of `.apextestsgitdeltarc`. Matched
  suites are resolved by reading the corresponding `<suiteName>.testSuite-meta.xml` at the `--to` commit and merging its
  `<testClassName>` entries into the output.

EXAMPLES
  `sf atgd delta --from "HEAD~1" --to "HEAD"`

  `sf atgd delta --from "HEAD~1" --to "HEAD" -v`

  `sf atgd delta --from "HEAD~1" --to "HEAD" --format sf`

  `sf apex run test $(sf atgd delta --from "HEAD~1" --to "HEAD" --format sf)`

  `sf atgd delta --to "develop" --from "main" --merge-base`
```

_See code: [src/commands/atgd/delta.ts](https://github.com/mcarvin8/apex-tests-git-delta/blob/v5.2.0/src/commands/atgd/delta.ts)_
<!-- commandsstop -->

## GitHub Action

For GitHub Actions, this is also available as a native Action - no `sf` CLI or plugin install required. It has no native/OS-level dependencies, so it runs on the standard `node24` Action runtime (no Docker image to pull).

```yaml
- name: Checkout
  uses: actions/checkout@v7
  with:
    fetch-depth: 0 # full history required - the action walks commits between `from` and `to`

- name: Resolve Apex tests
  id: delta
  uses: mcarvin8/apex-tests-git-delta@v5
  with:
    from: ${{ github.event.pull_request.base.sha }}
    to: ${{ github.sha }}

- name: Deploy with resolved tests
  run: sf project deploy start -x package/package.xml -l RunSpecifiedTests --tests ${{ steps.delta.outputs.tests }}
```

### Inputs

| Input                  | Description                                                                                                                        | Required | Default |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `from`                  | Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.                | Yes      |         |
| `to`                    | Commit SHA to where the commit message log is done.                                                                                  | No       | `HEAD`  |
| `skip-test-validation`  | Skip validating that tests exist in the local package directories.                                                                   | No       | `false` |
| `merge-base`            | Resolve `from` as the merge base of `to` and `from`, resolved in-process with no local git binary required.                          | No       | `false` |
| `format`                | Output format for the `tests` output. `space` outputs a space-separated list. `sf` outputs each test prefixed with `--tests`.        | No       | `space` |
| `working-directory`     | Directory containing the git repository and Salesforce project to inspect.                                                           | No       | workspace root |

### Outputs

| Output        | Description                                                          |
| -------------- | ---------------------------------------------------------------------- |
| `tests`        | The resolved test classes, formatted per the `format` input.         |
| `test-count`   | Number of distinct test classes in the result.                       |
| `suites`       | Newline-separated list of resolved Apex test suite names, if any.    |
| `suite-count`  | Number of resolved Apex test suites.                                  |
| `warnings`     | Newline-separated list of warnings emitted while resolving tests, if any. |

## Output Formats

| Format            | Flag          | Output                                         | Use with                            |
| ----------------- | ------------- | ---------------------------------------------- | ----------------------------------- |
| `space` (default) | _(omit)_      | `ClassA ClassB ClassC`                         | `sf project deploy start -t $(...)` |
| `sf`              | `--format sf` | `--tests ClassA --tests ClassB --tests ClassC` | `sf apex run test $(...)`           |

The `sf` format lets you compose this plugin directly into Salesforce CLI commands without any shell post-processing:

```bash
sf apex run test $(sf atgd delta --from "HEAD~1" --to "HEAD" --format sf)
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

[MIT](LICENSE.md)
