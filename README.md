# setup-protoc

[![Check npm Dependencies status](https://github.com/arduino/setup-protoc/actions/workflows/check-npm-dependencies-task.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-npm-dependencies-task.yml)
![test](https://github.com/arduino/setup-protoc/workflows/test/badge.svg)
[![Sync Labels status](https://github.com/arduino/setup-protoc/actions/workflows/sync-labels-npm.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/sync-labels-npm.yml)
[![Check Markdown status](https://github.com/arduino/setup-protoc/actions/workflows/check-markdown-task.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-markdown-task.yml)
[![Check License status](https://github.com/arduino/setup-protoc/actions/workflows/check-license.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-license.yml)
[![Check Taskfiles status](https://github.com/arduino/setup-protoc/actions/workflows/check-taskfiles.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-taskfiles.yml)
[![Integration Tests status](https://github.com/arduino/setup-protoc/actions/workflows/test-integration.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/test-integration.yml)
[![Check npm status](https://github.com/arduino/setup-protoc/actions/workflows/check-npm-task.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-npm-task.yml)
[![Check TypeScript status](https://github.com/arduino/setup-protoc/actions/workflows/check-typescript-task.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-typescript-task.yml)
[![Check tsconfig status](https://github.com/arduino/setup-protoc/actions/workflows/check-tsconfig-task.yml/badge.svg)](https://github.com/arduino/setup-protoc/actions/workflows/check-tsconfig-task.yml)

This action makes the `protoc` compiler available to Workflows.

## Usage

To get the latest stable version of `protoc` just add this step:

```yaml
- name: Install Protoc
  uses: arduino/setup-protoc@v1
```

If you want to pin a major or minor version you can use the `.x` wildcard:

```yaml
- name: Install Protoc
  uses: arduino/setup-protoc@v1
  with:
    version: '3.x'
```

You can also require to include releases marked as `pre-release` in Github using the `include-pre-releases` flag (the dafault value for this flag is `false`)

```yaml
- name: Install Protoc
  uses: arduino/setup-protoc@v1
  with:
    version: '3.x'
    include-pre-releases: true
```

To pin the exact version:

```yaml
- name: Install Protoc
  uses: arduino/setup-protoc@v1
  with:
    version: '3.9.1'
```

The action queries the GitHub API to fetch releases data, to avoid rate limiting,
pass the default token with the `repo-token` variable:

```yaml
- name: Install Protoc
  uses: arduino/setup-protoc@v1
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```


## Development

To work on the codebase you have to install all the dependencies:

```sh
# npm install
```

To run the tests:

```sh
# npm run test
```

## Enable verbose logging for a pipeline
Additional log events with the prefix ::debug:: can be enabled by setting the secret `ACTIONS_STEP_DEBUG` to `true`.

See [step-debug-logs](https://github.com/actions/toolkit/blob/master/docs/action-debugging.md#step-debug-logs) for reference.



## Release

We check in the `node_modules` to provide runtime dependencies to the system
using the Action, so be careful not to `git add` all the development dependencies
you might have under your local `node_modules`. To release a new version of the
Action the workflow should be the following:

1. `npm install` to add all the dependencies, included development.
1. `npm run test` to see everything works as expected.
1. `npm run build` to build the Action under the `./lib` folder.
1. `rm -rf node_modules` to remove all the dependencies.
1. `npm install --production` to add back **only** the runtime dependencies.
1. `git add lib node_modules` to check in the code that matters.
1. If the release will increment the major version, update the action refs in the examples in README.md
   (e.g., `uses: arduino/setup-protoc@v1` -> `uses: arduino/setup-protoc@v2`).
1. open a PR and request a review.
1. After PR is merged, create a release, following the `vX.X.X` tag name convention.
1. After the release, rebase the release branch for that major version (e.g., `v1` branch for the v1.x.x tags) on the tag.
   If no branch exists for the release's major version, create one.



## Security

If you think you found a vulnerability or other security-related bug in this project, please read our
[security policy](https://github.com/arduino/setup-protoc/security/policy) and report the bug to our Security Team 🛡️
Thank you!

e-mail contact: security@arduino.cc
