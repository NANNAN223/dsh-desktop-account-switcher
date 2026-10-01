# dsh-desktop-account-switcher

Save, label and switch multiple DeepSeek accounts in DSH Desktop (Settings → Accounts). Tokens stay on your machine; switching rewrites the platform credential grant and auto-refreshes the page. See [README.md](./README.md) (Chinese) for full docs.

## Install

- **Market (recommended):** DSH Desktop → Settings → Plugins → Community Market, search `account-switcher`.
- **Manual:** copy this package into `resources/app.asar.unpacked/node_modules/`, add the `insert` row from README.md to `harness/profiles/web/cordis.patch.yml`, restart DSH.

## HTTP API (localhost only)

GET `/dsh-desktop/account-switcher/state` · POST `save` · `switch {"id"}` · `rename {"id","name"}` (empty string clears) · `remove {"id"}` (409 for the active account).

## License

[MIT](./LICENSE)
