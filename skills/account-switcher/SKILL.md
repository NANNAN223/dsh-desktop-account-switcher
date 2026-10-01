---
name: account-switcher
description: >
  Operate the dsh-desktop-account-switcher plugin on the user's behalf:
  list saved DeepSeek accounts, show which one is active, switch to another
  saved account, rename an account's display label (备注), or save the
  currently signed-in account. Use whenever the user says 切换账号, 换号,
  账号列表, 切换到XX号, switch account, or asks which DeepSeek accounts are
  saved. Requires the plugin to be installed and DSH restarted once. Tokens
  never leave the machine; only localhost API calls are used.
argument-hint: "[要切换到的账号备注名]"
---

# Account Switcher 操作

通过 DSH 本机 HTTP API 操作账号切换插件(仅 127.0.0.1 可访问)。

## 步骤

1. 查询状态:`GET http://127.0.0.1:43129/dsh-desktop/account-switcher/state`
   - 响应:`current`(当前账号,含 id/name/alias/saved)+ `accounts[]`(账号库,每项含 id/alias/name/addedAt/active/invalid)
2. 展示账号列表:主名用 `alias || name || id`,标注 active 与 addedAt(本地时间)。
3. 切换:`POST /dsh-desktop/account-switcher/switch`,body `{"id":"<目标id>"}`;成功后告知用户页面会自动刷新。
4. 备注:`POST /dsh-desktop/account-switcher/rename`,body `{"id":"<id>","name":"<新备注>"}`;空字符串清除备注;>40 字会被 400 拒绝。
5. 保存当前登录:`POST /dsh-desktop/account-switcher/save`,body `{}`。
6. 删除:`POST /dsh-desktop/account-switcher/remove`,body `{"id"}`;当前使用中的账号返回 409,须先切走。

## 注意

- 非本机请求会被拒绝;不要把 `accounts.json` 或 state 里的凭据外发。
- 404 = 插件未安装或 DSH 未重启;提示用户检查设置 → 插件。
