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

## 安装(GitHub 直接安装,推荐)

无需 npm 市场,用 git 拉取即可。

### 第 1 步:克隆插件到 DSH 插件目录

PowerShell 里执行(把第一行的路径换成你的 DSH 实际安装路径):

```powershell
cd "D:\dsh\DSH Desktop\resources\app.asar.unpacked\node_modules"
git clone https://github.com/NANNAN223/dsh-desktop-account-switcher.git dsh-desktop-account-switcher
```

> 末尾的 `dsh-desktop-account-switcher` 指定目录名,**必须**叫这个名字。

### 第 2 步:挂载插件

用记事本打开补丁文件:

```powershell
notepad "$env:APPDATA\dsh-desktop\harness\profiles\web\cordis.patch.yml"
```

在文件末尾追加(把路径换成你的实际安装路径):

```yaml
- insert:
    - id: dsh-desktop-account-switcher
      name: "file:///D:/dsh/DSH%20Desktop/resources/app.asar.unpacked/node_modules/dsh-desktop-account-switcher/index.js"
```

路径书写规则:`file:///` 开头 + 完整路径,**正斜杠**,路径里的**空格写成 %20**(如 `DSH Desktop` → `DSH%20Desktop`);路径没有空格则原样即可。

### 第 3 步:重启 DSH

设置 → 账号切换,出现面板即安装成功。

### 更新与卸载

- 更新:进入插件目录 `git pull`,重启 DSH。
- 卸载:删除插件目录,并删除 cordis.patch.yml 里对应 `- insert:` 段。

> 若之前手动装过同 id 条目,请先删除旧行,避免重复挂载。npm 插件市场版本因注册受阻暂未上架,后续上架后市场搜索 `account-switcher` 即可。

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
