#!/usr/bin/env bash
# Builds a disposable Salesforce-project git repo outside the Action's own
# checkout (so it never collides with this repo's real .git) for
# smoke-test-action.yml to point the Action at via `working-directory`.
set -euo pipefail

FIXTURE_DIR="${RUNNER_TEMP:-/tmp}/atgd-smoke-fixture"
rm -rf "$FIXTURE_DIR"
mkdir -p "$FIXTURE_DIR/force-app/main/default/classes"
cd "$FIXTURE_DIR"

git init -q
git config user.email "smoke-test@example.com"
git config user.name "ATGD Smoke Test"

printf '%s\n' '[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]' > .apextestsgitdeltarc

cat > sfdx-project.json <<'JSON'
{
  "packageDirectories": [{ "path": "force-app", "default": true }],
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "62.0"
}
JSON

echo 'public with sharing class AccountTest {}' > force-app/main/default/classes/AccountTest.cls
git add -A
git commit -q -m "chore: seed fixture"
FROM_SHA="$(git rev-parse HEAD)"

echo 'public with sharing class AccountTest { /* v2 */ }' > force-app/main/default/classes/AccountTest.cls
git add -A
git commit -q -m "fix: bump coverage Apex::AccountTest::Apex"
TO_SUCCESS_SHA="$(git rev-parse HEAD)"

echo 'public with sharing class AccountTest { /* v3 */ }' > force-app/main/default/classes/AccountTest.cls
git add -A
git commit -q -m "fix: reference missing class Apex::GhostTest::Apex"
TO_WARNING_SHA="$(git rev-parse HEAD)"

{
  echo "dir=$FIXTURE_DIR"
  echo "from=$FROM_SHA"
  echo "to-success=$TO_SUCCESS_SHA"
  echo "to-warning=$TO_WARNING_SHA"
} >> "$GITHUB_OUTPUT"
