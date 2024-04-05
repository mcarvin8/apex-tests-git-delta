# summary

Returns all of the Apex Tests defined in the commit messages between 2 git commits.

# description

Given 2 git commits, this plugin will parse all of the commit messages between this range and return the delta Apex test class string. This can be used to execute delta deployments.

# examples

- `sf apex-tests-git-delta delta --from "c7603c255" --to "HEAD" --regular-expression "regex.txt" --sfdx-configuration "sfdx-project.json" --output "runTests.txt"`

# flags.from.summary

Commit SHA from where the commit message log is done. This SHA's commit message will not be included in the results.

# flags.to.summary

Commit SHA to where the commit message log is done.

# flags.regular-expression.summary

The regular expression to use when parsing commit messages for Apex Tests.

# flags.sfdx-configuration.summary

Path to your project's Salesforce DX configuration file.

# flags.output.summary

The text file to save the delta test classes to.
