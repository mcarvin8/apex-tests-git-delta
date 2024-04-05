# summary

Returns all of the Apex Tests defined in the commit messages between 2 git commits.

# description

Given 2 git commits, this plugin will parse all of the commit messages between this range, including the '--from' commit, and return the delta Apex test class string. This can be used to execute delta deployments.

# examples

- `sf apex-tests-git-delta delta --from "abcdef" --to "ghifb" --regular-expression "regex.txt" --output "runTests.txt"`

# flags.from.summary

Git commit SHA from where the commit message log is done.

# flags.to.summary

Git commit SHA to where the commit message log is done.

# flags.regular-expression.summary

The text file containing the Apex Tests regular expression to search for.

# flags.output.summary

The text file to save the delta test classes to.