# dsh-desktop-account-switcher

Save, label and switch multiple DeepSeek accounts in DSH Desktop (Settings → Accounts). Tokens stay on your machine; switching rewrites the platform credential grant and auto-refreshes the page. Every saved account is re-checked in the background (shortly after boot, then every 6h) so the whole library stays verifiably signed in — switching never signs the others out. See [README.md](./README.md) (Chinese) for full docs.

## Install

- **Install from GitHub (recommended):** clone into DSH's plugin directory and add one mount row — full commands in [README.md](./README.md):

```powershell
cd "<DSH install path>\resources\app.asar.unpacked\node_modules"
git clone https://github.com/NANNAN223/dsh-desktop-account-switcher.git dsh-desktop-account-switcher
```

then append to `$env:APPDATA\dsh-desktop\harness\profiles\web\cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-desktop-account-switcher
      name: "file:///<DSH install path with forward slashes and %20 for spaces>/resources/app.asar.unpacked/node_modules/dsh-desktop-account-switcher/index.js"
```

and restart DSH. Update with `git pull` inside the plugin folder.
- **Market:** npm release pending; not yet published.

## HTTP API (localhost only)

GET `/dsh-desktop/account-switcher/state` · POST `save` · `switch {"id"}` · `rename {"id","name"}` (empty string clears) · `remove {"id"}` (409 for the active account) · `pin {"id","pinned"}` · `check {}` or `check {"id"}` · `signin-window {"url"}` / `signin-window/close`.

## License

[MIT](./LICENSE)
