## Development workflow

### 1. Install tools

#### Node.js

[**npm**](https://www.npmjs.com/) is used for dependency management.

Follow the installation instructions here:<br />
https://nodejs.dev/en/download

### 2. Install dependencies

To work on the codebase you have to install all the dependencies:

```
npm install
```

### 3. Coding

Now you're ready to work some [TypeScript](https://www.typescriptlang.org/) magic!

Make sure to write or update tests for your work when appropriate.

### 4. Format code

Format the code to follow the standard style for the project:

```
npm run format
```

### 5. Run tests

To run the tests:

```
npm run test
```

### 6. Build

It is necessary to compile the code before it can be used by GitHub Actions. We check in the `node_modules` to provide runtime dependencies to the system using the Action, so be careful not to `git add` all the development dependencies you might have under your local `node_modules`.
Remember to run these commands before committing any code changes:

```
npm run build
```

remove all the dependencies:

```
rm -rf node_modules
```

add back **only** the runtime dependencies:

```
npm install --production
```

check in the code that matters:

```
git add lib node_modules
```

### 7. Commit

Everything is now ready to make your contribution to the project, so commit it to the repository and submit a pull request.

Thanks!

## Release workflow

To release a new version of the Action the workflow should be the following:

1. If the release will increment the major version, update the action refs in the examples in README.md
   (e.g., `uses: arduino/setup-protoc@v1` -> `uses: arduino/setup-protoc@v2`).
1. open a PR and request a review.
1. After PR is merged, create a release, following the `vX.X.X` tag name convention.
1. After the release, rebase the release branch for that major version (e.g., `v1` branch for the v1.x.x tags) on the tag.
   If no branch exists for the release's major version, create one.
