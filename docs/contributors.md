# Contributors

### Checkin

- Do checkin source (src)
- Do checkin build output (lib)
- Do checkin runtime node_modules
- Do not checkin devDependency node_modules (husky can help see below)

### devDependencies

In order to handle correctly checking in node_modules without devDependencies, we run [Husky](https://github.com/typicode/husky) before each commit.
This step ensures that formatting and checkin rules are followed and that devDependencies are excluded. To make sure Husky runs correctly, please use the following workflow:

```
npm install                                 # installs all devDependencies including Husky
git add abc.ext                             # Add the files you've changed. This should include files in src, lib, and node_modules (see above)
git commit -m "Informative commit message"  # Commit. This will run Husky
```

During the commit step, Husky will take care of formatting all files with [Prettier](https://github.com/prettier/prettier) as well as pruning out devDependencies using `npm prune --production`.
It will also make sure these changes are appropriately included in your commit (no further work is needed)

## Dependency license metadata

Metadata about the license types of all dependencies is cached in the repository. To update this cache, run the following command from the repository root folder:

```
task general:cache-dep-licenses
```

The necessary **Licensed** tool can be installed by following [these instructions](https://github.com/github/licensed#as-an-executable).

Unfortunately, **Licensed** does not have support for being used on the **Windows** operating system.

An updated cache is also generated whenever the cache is found to be outdated by the by the "Check Go Dependencies" CI workflow and made available for download via the `dep-licenses-cache` [workflow artifact](https://docs.github.com/actions/managing-workflow-runs/downloading-workflow-artifacts).
