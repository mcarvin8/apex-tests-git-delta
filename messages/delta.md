# summary

Determine Apex tests by parsing commit messages.

# description

Determine Apex tests for incremental deployments by parsing commit messages between 2 commits. Commit messages may reference individual Apex test classes (e.g. `Apex::MyTest::Apex`) or Apex Test Suites (e.g. `Suite::MyTestSuite::Suite`) when a suite regex is configured on the 2nd line of `.apextestsgitdeltarc`. Matched suites are resolved by reading the corresponding `<suiteName>.testSuite-meta.xml` at the `--to` commit and merging its `<testClassName>` entries into the output.

# examples

- `sf atgd delta --from "HEAD~1" --to "HEAD"`
- `sf atgd delta --from "HEAD~1" --to "HEAD" -v`

# flags.from.summary

Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.

# flags.to.summary

Commit SHA to where the commit message log is done.

# flags.skip-test-validation.summary

Skip validating that tests exist in the local package directories.
