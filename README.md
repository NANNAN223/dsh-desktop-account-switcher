# dsh-desktop-account-switcher

DSH Desktop 的 DeepSeek 多账号切换插件:在 **设置 → 账号切换** 里保存多个 DeepSeek 账号、一键切换、加备注名,切换后页面自动刷新。

## 功能

- **保存当前账号**:把当前登录的 DeepSeek 账号存入本地账号库(token 仅存本机 `<DSH_HOME>/account-switcher/accounts.json`)
- **登录新账号**:发起 DeepSeek 平台登录,成功后自动入库
- **一键切换**:切换后自动刷新页面,全站以新账号身份生效
- **备注名**:给账号起别名(≤40 字),与官方资料名分开存储,留空恢复默认
- **添加时间**:每个账号显示入库时间
- **失效标记**:token 失效的账号自动标记;当前使用中的账号禁止删除
- 中英双语,跟随系统语言

## 安装

### 方式 A:DSH Community Market(推荐)

DSH Desktop → 设置 → 插件 → 社区市场,搜索 `account-switcher` 安装,重启 DSH。

### 方式 B:手动安装

1. 复制本包到 `<DSH 安装目录>/resources/app.asar.unpacked/node_modules/dsh-desktop-account-switcher`
2. 在 `<用户目录>/AppData/Roaming/dsh-desktop/harness/profiles/web/cordis.patch.yml` 追加:

```yaml
- insert:
    - id: dsh-desktop-account-switcher
      name: "file:///<DSH 安装目录>/resources/app.asar.unpacked/node_modules/dsh-desktop-account-switcher/index.js"
```

3. 重启 DSH。

> 若之前手动装过同 id 条目,请先删除旧行再从市场安装,避免重复挂载。

## 数据与安全

- 所有 token 只保存在本机 `${DSH_HOME}/account-switcher/accounts.json`,插件不向任何第三方上传数据
- 切换通过 DSH 自身的凭据系统(`credentials.modifyRecord`)完成,与官方登录等效
- 建议:账号文件含登录凭据,请勿分享 `accounts.json`

## 配套 Skill(可选)

把 `skills/account-switcher/SKILL.md` 复制到 `<用户目录>/AppData/Roaming/dsh-desktop/harness/skills/account-switcher/`,AI 助手即可在对话里帮你查询/切换账号(如「帮我切换到主力号」)。

## HTTP API(本机)

插件在 DSH 本机服务上暴露(仅接受 127.0.0.1 本地请求):

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/dsh-desktop/account-switcher/state` | 当前账号 + 账号库 |
| POST | `/dsh-desktop/account-switcher/save` | 保存当前账号入库 |
| POST | `/dsh-desktop/account-switcher/switch` | `{"id"}` 切换 |
| POST | `/dsh-desktop/account-switcher/rename` | `{"id","name"}` 备注,空串清除 |
| POST | `/dsh-desktop/account-switcher/remove` | `{"id"}` 删除(当前号 409) |

## 兼容性

DSH Desktop web 平台,engines `dsh >= 0.1.0-rc.6`(在 0.1.7-rc.2 上开发验证)。

## License

[MIT](./LICENSE)
