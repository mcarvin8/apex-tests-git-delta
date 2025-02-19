# summary

Determine Apex tests by parsing commit messages.

# description

Determine Apex tests for incremental deployments by parsing commit messages between 2 commits.

# examples

- `sf atgd delta --from "HEAD~1" --to "HEAD"`

# flags.from.summary

Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.

# flags.to.summary

Commit SHA to where the commit message log is done.

# flags.skip-test-validation.summary

Skip validating that tests exist in the local package directories.
