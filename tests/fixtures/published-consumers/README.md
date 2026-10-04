# Published consumer templates

These isolated templates pin the initial Next/Vite dependencies. The npm and pnpm profiles carry independently generated lockfiles. Source templates end in `.txt` so the repository typecheck does not treat their consumer aliases as repository imports; materialization removes that suffix.

The published runner uses `npm ci --ignore-scripts` or `pnpm install --frozen-lockfile --ignore-scripts` before invoking the exact official CLI package. CLI installation may update the consumer lockfile to include Registry dependencies. Each matrix uses its own project, configuration and caches.

Every template includes its own `pnpm-workspace.yaml`. This boundary prevents a consumer under the repository's ignored output directory from joining the parent workspace or modifying its dependencies. The main project excludes `output/**` from typechecking; each consumer checks its own sources with its own installed dependencies.

The Next stylesheet explicitly excludes `node_modules` and `.next` from Tailwind source detection. These consumers do not create their own Git repository, so do not rely on inherited ignore rules to bound automatic scanning. Keep application, examples, installed components, hooks and libraries in the scan; dependency packages and generated bundles must not contribute utility candidates. See [Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).

`business.ts` is a preservation sentinel. Preflight and rejected installs compare the entire project file inventory. The generated verification entry imports every configured representative before standalone typechecking and framework production building.

Do not update a lockfile during a verification run. To intentionally update these profiles, regenerate each lockfile in a fresh temporary directory with the matching manager, check the template build, and commit the changed template/lockfile hashes together. Template bootstrap and CLI help checks alone do not count as a published Registry installation matrix.
