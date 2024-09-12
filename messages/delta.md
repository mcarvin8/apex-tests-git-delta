# summary

Returns all of the Apex Tests defined in the commit messages between 2 git commits.

# description

Given 2 git commits, this plugin will parse all of the commit messages between this range and return the delta Apex test class string. This can be used to execute delta deployments.

# examples

- `sf apex-tests-git-delta delta --from "HEAD~1" --to "HEAD"`

# flags.from.summary

Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.

# flags.to.summary

Commit SHA to where the commit message log is done.
