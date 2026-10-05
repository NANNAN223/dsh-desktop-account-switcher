/**
 * dsh-desktop-account-switcher v2 — client half (asw2-5).
 * Adds a "账号切换 / Accounts" section to the desktop Settings page.
 * v2: pinned accounts sort first, invalid accounts can re-login in place
 * (carry-over swap), and the panel shows a self-check footer.
 * asw2-3: keep-alive status pills per account (在线 / 未检查 / 已失效) plus a
 * 检查全部 button that POSTs the host check route and reports the tally.
 * asw2-4: per-account 保活 checkbox (opt out of scheduled checks), a 不保活
 * pill for opted-out rows, and a GitHub project link at the panel footer.
 * asw2-5: the sign-in page opens through LOGIN_WINDOW_PATH (trusted loopback
 * bridge) so the window really appears in-app on Windows; the popup handle is
 * kept so success/cancel closes it.
 */
window.__ModuleLoader__.load({
  id: 'dsh-desktop-account-switcher',
  factory: (require) => {
    const React = require('react')
    const jsxrt = require('react/jsx-runtime')
    const jsx = (type, props, key) => (props && Array.isArray(props.children) ? jsxrt.jsxs : jsxrt.jsx)(type, props, key)

    const STATE_PATH = '/dsh-desktop/account-switcher/state'
    const SAVE_PATH = '/dsh-desktop/account-switcher/save'
    const SWITCH_PATH = '/dsh-desktop/account-switcher/switch'
    const REMOVE_PATH = '/dsh-desktop/account-switcher/remove'
    const RENAME_PATH = '/dsh-desktop/account-switcher/rename'
    const PIN_PATH = '/dsh-desktop/account-switcher/pin'
    const CHECK_PATH = '/dsh-desktop/account-switcher/check'
const SIGNIN_WINDOW_PATH = '/dsh-desktop/account-switcher/signin-window'
const SIGNIN_WINDOW_CLOSE_PATH = '/dsh-desktop/account-switcher/signin-window/close'
    const LOGIN_WINDOW_PATH = '/dsh-desktop/account-switcher/login-window'
    const KEEPALIVE_PATH = '/dsh-desktop/account-switcher/keep-alive'
    const REPO_URL = 'https://github.com/NANNAN223/dsh-desktop-account-switcher'
    const NS = 'settings.accountSwitcher'
    const LIB_VERSION = 'asw2-5'
    const CLIENT_VERSION = '0.2.0-rc.2'

    const zh = {
      nav: '账号切换',
      title: 'DeepSeek 账号切换',
      intro: '保存多个 DeepSeek 账号，随时一键切换推理使用的账号。支持置顶常用账号、失效账号原地重新登录。',
      hint: '切换立即生效，当前对话会改用新账号。账号令牌只保存在本机；账号库会定时保活检查（默认每 6 小时），可在每行用「保活」勾选决定哪些账号参与，账号互不挤下线，失效的可原地重新登录。',
      current: '当前账号',
      notSignedIn: '当前未登录任何账号。',
      fingerprint: '指纹',
      saved: '已在账号库',
      saveCurrent: '保存当前账号',
      saving: '保存中…',
      library: '账号库',
      empty: '账号库还是空的。先保存当前账号，或登录一个新账号。',
      switchTo: '切换到此账号',
      switching: '切换中…',
      switchedRefresh: '切换成功，正在刷新页面…',
      addedAt: '添加于',
      active: '使用中',
      pin: '置顶',
      pinned: '已置顶。',
      unpin: '取消置顶',
      unpinned: '已取消置顶。',
      remove: '删除',
      invalid: '已失效',
      relogin: '重新登录',
      reloginDone: '已重新登录，账号已更新。',
      addAccount: '登录新账号…',
      signInHint: '浏览器窗口已打开授权页，完成登录后这里会自动继续。',
      signInAppHint: '已在本应用窗口打开官方登录页（应用内窗口没有浏览器里的登录状态，若要求登录请直接输入手机号/密码）。完成后窗口自动关闭、账号自动入库。',
      signInLink: '打不开窗口？点这里手动打开授权链接。',
      signInCancel: '取消登录',
      signedInNew: '登录成功，新账号已加入账号库。',
      signInCancelled: '登录已取消或未完成。',
      confirmSwitch: '切换到这个账号？当前对话会改用它继续。',
      confirmRemove: '确定要从账号库删除这个账号吗？',
      refresh: '刷新',
      loading: '加载中…',
      remoteUnavailable: '登录服务不可用，暂时无法发起新账号登录。',
      rename: '备注',
      renameSave: '保存',
      renameCancel: '取消',
      renamePlaceholder: '输入备注名…',
      renamed: '已更新备注名。',
      checkAll: '检查全部',
      checking: '检查中…',
      online: '在线',
      unchecked: '未检查',
      paused: '不保活',
      keepAlive: '保活',
      keepAliveHint: '勾选后该账号参与定时保活复检；取消勾选只保留本地记录，不再自动复检。',
      keepAliveOn: '已开启保活。',
      keepAliveOff: '已关闭保活。',
      repo: '打开 GitHub 项目主页',
      checkDone: '检查完成：{online}/{total} 个账号在线',
      meta: '自检'
    }
    const en = {
      nav: 'Accounts',
      title: 'DeepSeek account switching',
      intro: 'Save several DeepSeek accounts and switch the active one anytime. Pin favorites, re-login expired ones in place.',
      hint: 'Switching applies immediately; new requests use the selected account. Tokens stay on this machine. Saved accounts are re-checked on a schedule (every 6h by default); tick 保活 / Keep alive per row to choose which ones join the checks. Switching never signs the others out.',
      current: 'Current account',
      notSignedIn: 'No account is signed in right now.',
      fingerprint: 'fingerprint',
      saved: 'in library',
      saveCurrent: 'Save current account',
      saving: 'Saving…',
      library: 'Account library',
      empty: 'The library is empty. Save the current account or sign in with a new one.',
      switchTo: 'Switch to this account',
      switching: 'Switching…',
      switchedRefresh: 'Switched. Refreshing page…',
      addedAt: 'Added',
      active: 'Active',
      pin: 'Pin',
      pinned: 'Pinned.',
      unpin: 'Unpin',
      unpinned: 'Unpinned.',
      remove: 'Remove',
      invalid: 'Expired',
      relogin: 'Re-login',
      reloginDone: 'Re-signed in; the account was updated.',
      addAccount: 'Sign in with another account…',
      signInHint: 'A browser window opened for authorization. This panel continues automatically.',
      signInAppHint: 'The official sign-in page opened inside an app window (it has no cookies from your browser, so sign in with your phone/password if asked). It closes and the account is saved when you finish.',
      signInLink: 'Window did not open? Click here to open the authorization link.',
      signInCancel: 'Cancel sign-in',
      signedInNew: 'Signed in. The new account was added to the library.',
      signInCancelled: 'Sign-in was cancelled or did not finish.',
      confirmSwitch: 'Switch to this account? Ongoing conversations will use it from now on.',
      confirmRemove: 'Remove this account from the library?',
      refresh: 'Refresh',
      loading: 'Loading…',
      remoteUnavailable: 'Sign-in service is unavailable; cannot start a new account sign-in right now.',
      rename: 'Rename',
      renameSave: 'Save',
      renameCancel: 'Cancel',
      renamePlaceholder: 'Enter a display name…',
      renamed: 'Name updated.',
      checkAll: 'Check all',
      checking: 'Checking…',
      online: 'Online',
      unchecked: 'Not checked',
      paused: 'Paused',
      keepAlive: 'Keep alive',
      keepAliveHint: 'Include this account in scheduled keep-alive checks; untick to keep the local record without re-checking it.',
      keepAliveOn: 'Keep-alive enabled.',
      keepAliveOff: 'Keep-alive disabled.',
      repo: 'Open the GitHub project page',
      checkDone: 'Check done: {online}/{total} online',
      meta: 'Self-check'
    }

    const css = [
      '.asw-section { display: flex; flex-direction: column; gap: 14px; max-width: 640px; }',
      '.asw-title { font-size: 15px; font-weight: 600; color: var(--dsw-alias-text-primary, inherit); margin: 0; }',
      '.asw-intro { font-size: 12px; color: var(--dsw-alias-text-secondary, inherit); margin: 0; line-height: 1.6; }',
      '.asw-hint { font-size: 11px; color: var(--dsw-alias-text-tertiary, inherit); margin: 0; line-height: 1.6; }',
      '.asw-card { border: 1px solid var(--dsw-alias-border-primary, rgba(128,128,128,.25)); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; background: var(--dsw-alias-surface-primary, transparent); }',
      '.asw-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }',
      '.asw-label { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--dsw-alias-text-tertiary, inherit); }',
      '.asw-row { display: flex; align-items: center; gap: 10px; min-width: 0; }',
      '.asw-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex: none; }',
      '.asw-avatar-fallback { width: 28px; height: 28px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: var(--dsw-alias-fill-secondary, rgba(128,128,128,.2)); }',
      '.asw-main { min-width: 0; flex: 1; }',
      '.asw-name { font-size: 13px; font-weight: 600; color: var(--dsw-alias-text-primary, inherit); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.asw-sub { font-size: 11px; color: var(--dsw-alias-text-tertiary, inherit); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.asw-badge { flex: none; font-size: 10px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-primary, rgba(128,128,128,.35)); color: var(--dsw-alias-text-secondary, inherit); }',
      '.asw-badge-active { border-color: transparent; background: var(--dsw-alias-brand-primary, #4d6bfe); color: #fff; }',
      '.asw-badge-invalid { border-color: transparent; background: var(--dsw-alias-status-danger-bg, rgba(220,38,38,.15)); color: var(--dsw-alias-status-danger-text, #dc2626); }',
      '.asw-badge-online { border-color: transparent; background: var(--dsw-alias-status-success-bg, rgba(22,163,74,.15)); color: var(--dsw-alias-status-success-text, #16a34a); }',
      '.asw-check { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--dsw-alias-text-secondary, inherit); cursor: pointer; user-select: none; }',
      '.asw-check input { margin: 0; cursor: pointer; }',
      '.asw-check input:disabled { cursor: not-allowed; }',
      '.asw-actions { display: flex; gap: 8px; flex-wrap: wrap; }',
      '.asw-input { flex: 1; min-width: 0; border: 1px solid rgba(127,127,127,.45); border-radius: 8px; padding: 4px 8px; font-size: 12px; background: transparent; color: inherit; }',
      '.asw-btn { appearance: none; border: 1px solid var(--dsw-alias-border-primary, rgba(128,128,128,.35)); background: transparent; color: var(--dsw-alias-text-primary, inherit); border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer; }',
      '.asw-btn:hover:not(:disabled) { background: var(--dsw-alias-fill-secondary, rgba(128,128,128,.12)); }',
      '.asw-btn:disabled { opacity: .5; cursor: not-allowed; }',
      '.asw-btn-primary { background: var(--dsw-alias-brand-primary, #4d6bfe); border-color: transparent; color: #fff; }',
      '.asw-btn-primary:hover:not(:disabled) { filter: brightness(1.08); background: var(--dsw-alias-brand-primary, #4d6bfe); }',
      '.asw-btn-danger { color: var(--dsw-alias-status-danger-text, #dc2626); }',
      '.asw-error { font-size: 12px; color: var(--dsw-alias-status-danger-text, #dc2626); margin: 0; }',
      '.asw-notice { font-size: 12px; color: var(--dsw-alias-status-success-text, #16a34a); margin: 0; }',
      '.asw-empty { font-size: 12px; color: var(--dsw-alias-text-tertiary, inherit); margin: 0; }',
      '.asw-list { display: flex; flex-direction: column; gap: 8px; }',
      '.asw-link { font-size: 12px; color: var(--dsw-alias-brand-primary, #4d6bfe); }',
      '.asw-meta { font-size: 10px; color: var(--dsw-alias-text-tertiary, inherit); margin: 0; line-height: 1.6; word-break: break-all; opacity: .8; }',
      '.asw-footer { display: flex; align-items: center; padding-top: 2px; }',
      '.asw-repo { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-text-secondary, inherit); text-decoration: none; }',
      '.asw-repo:hover { color: var(--dsw-alias-brand-primary, #4d6bfe); }'
    ].join('\n')

    let styleInjected = false
    const injectStyle = () => {
      if (styleInjected || typeof document === 'undefined') return
      const style = document.createElement('style')
      style.dataset.plugin = 'dsh-desktop-account-switcher'
      style.dataset.pluginCss = 'settings-section'
      style.textContent = css
      document.head.appendChild(style)
      styleInjected = true
    }

    const Avatar = ({ url, name }) => {
      const [broken, setBroken] = React.useState(false)
      React.useEffect(() => setBroken(false), [url])
      if (url && !broken) return jsx('img', { className: 'asw-avatar', src: url, alt: '', onError: () => setBroken(true) })
      const letter = (name || '?').trim().slice(0, 1).toUpperCase()
      return jsx('span', { className: 'asw-avatar-fallback', children: letter })
    }

    const formatTime = (value) => {
      const date = new Date(value)
      return Number.isFinite(date.getTime()) ? date.toLocaleString() : null
    }

    const requestJson = async (path, init) => {
      const response = await fetch(path, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
        headers: { accept: 'application/json', ...(init && init.body ? { 'content-type': 'application/json' } : {}), ...(init && init.headers) }
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error((payload && payload.error) || ('request failed: ' + response.status))
      return payload
    }

    const AccountRow = ({ t, entry, busy, onSwitch, onRemove, onRename, onPin, onKeepAlive, onRelogin, renaming, renameValue, onRenameChange, onRenameConfirm, onRenameCancel }) => {
      const isBusy = busy !== null
      return jsx('div', { className: 'asw-card', children:
        jsx('div', { className: 'asw-row', children: [
          jsx(Avatar, { url: entry.avatarUrl, name: entry.name }, 'avatar'),
          jsx('div', { className: 'asw-main', children: [
            jsx('div', { className: 'asw-name', children: (entry.pinned ? '📌 ' : '') + (entry.alias || entry.name || entry.id) }),
            jsx('div', { className: 'asw-sub', children: [entry.addedAt ? t('addedAt') + ' ' + formatTime(entry.addedAt) : null, entry.alias ? entry.name : null, entry.contact, t('fingerprint') + ' ' + entry.id].filter(Boolean).join(' · ') })
          ] }, 'main'),
          entry.active ? jsx('span', { className: 'asw-badge asw-badge-active', children: t('active') }, 'badge') : null,
          !entry.active && entry.invalid ? jsx('span', { className: 'asw-badge asw-badge-invalid', children: t('invalid') }, 'badge') : null,
          !entry.active && !entry.invalid && entry.keepAlive === false ? jsx('span', { className: 'asw-badge', children: t('paused') }, 'badge') : null,
          !entry.active && !entry.invalid && entry.keepAlive !== false && entry.lastOkAt ? jsx('span', { className: 'asw-badge asw-badge-online', title: entry.checkedAt ? formatTime(entry.checkedAt) : undefined, children: t('online') }, 'badge') : null,
          !entry.active && !entry.invalid && entry.keepAlive !== false && !entry.lastOkAt ? jsx('span', { className: 'asw-badge', title: entry.checkedAt ? formatTime(entry.checkedAt) : undefined, children: t('unchecked') }, 'badge') : null,
          jsx('div', { className: 'asw-actions', children: renaming ? [
            jsx('input', {
              className: 'asw-input',
              value: renameValue,
              placeholder: t('renamePlaceholder'),
              autoFocus: true,
              onChange: (event) => onRenameChange(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) onRenameConfirm() }
            }, 'input'),
            jsx('button', { className: 'asw-btn asw-btn-primary', disabled: busy !== null, onClick: onRenameConfirm, children: t('renameSave') }, 'save'),
            jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: onRenameCancel, children: t('renameCancel') }, 'cancel')
          ] : [
            entry.invalid
              ? jsx('button', {
                  className: 'asw-btn asw-btn-primary',
                  disabled: isBusy,
                  onClick: () => onRelogin(entry),
                  children: busy === 'signin' ? '…' : t('relogin')
                }, 'relogin')
              : jsx('button', {
                  className: 'asw-btn asw-btn-primary',
                  disabled: isBusy || entry.active || entry.invalid,
                  onClick: () => onSwitch(entry),
                  children: busy === 'switch:' + entry.id ? t('switching') : t('switchTo')
                }, 'switch'),
            jsx('label', {
              className: 'asw-check',
              title: t('keepAliveHint'),
              children: [
                jsx('input', { type: 'checkbox', checked: entry.keepAlive !== false, disabled: isBusy, onChange: () => onKeepAlive(entry) }, 'box'),
                jsx('span', { children: t('keepAlive') }, 'text')
              ]
            }, 'keepalive'),
            jsx('button', {
              className: 'asw-btn',
              disabled: isBusy,
              onClick: () => onPin(entry),
              children: busy === 'pin:' + entry.id ? '…' : (entry.pinned ? t('unpin') : t('pin'))
            }, 'pin'),
            jsx('button', {
              className: 'asw-btn',
              disabled: isBusy,
              onClick: () => onRename(entry),
              children: t('rename')
            }, 'rename'),
            jsx('button', {
              className: 'asw-btn asw-btn-danger',
              disabled: isBusy || entry.active,
              onClick: () => onRemove(entry),
              children: busy === 'remove:' + entry.id ? '…' : t('remove')
            }, 'remove')
          ] }, 'actions')
        ] }, 'row')
      })
    }

    class AswBoundary extends React.Component {
      constructor(props) { super(props); this.state = { error: null } }
      static getDerivedStateFromError(error) { return { error } }
      componentDidCatch(error, info) { try { console.error('[account-switcher] render error', error, info) } catch {} }
      render() {
        if (this.state.error) {
          return jsx('div', { className: 'asw-section', 'data-asw-version': LIB_VERSION, children: [
            jsx('h2', { className: 'asw-title', children: this.props.t ? this.props.t('title') : 'DeepSeek account switching' }, 'title'),
            jsx('p', { className: 'asw-error', children: '[' + LIB_VERSION + '] render error: ' + String((this.state.error && this.state.error.message) || this.state.error) }, 'error')
          ] })
        }
        return jsx(Section, this.props)
      }
    }

    const Section = ({ t, ops, close }) => {
      const [state, setState] = React.useState(null)
      const [busy, setBusy] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)
      const [signIn, setSignIn] = React.useState(null)
      // The poll interval captures the first render's closure, so re-login
      // targets ride along in a ref instead of state.
      const reloginIdRef = React.useRef(null)
      // Handle of the in-app sign-in window opened via LOGIN_WINDOW_PATH, so
      // this panel can close it when the attempt succeeds or is cancelled.
      const signWindowRef = React.useRef(null)

      const refresh = React.useCallback(async () => {
        try {
          setState(await requestJson(STATE_PATH))
          setError(null)
        } catch (e) {
          setError(String((e && e.message) || e))
        }
      }, [ops])

      React.useEffect(() => { refresh() }, [refresh])

      const closeLoginWindow = React.useCallback(() => {
        const win = signWindowRef.current
        signWindowRef.current = null
        try {
          if (win && win.closed !== true) win.close()
        } catch { /* 跨域窗口句柄关闭时可能抛错 */ }
      }, [])

      // Poll the account service while a sign-in attempt runs.
      React.useEffect(() => {
        if (!signIn) return
        let stopped = false
        let openedUrl = null
        const timer = setInterval(async () => {
          if (stopped) return
          try {
            if (!ops) throw new Error('remote unavailable')
            const snapshot = await ops.getState()
            if (stopped) return
            const attempt = snapshot.attempt
            if (attempt && attempt.authorizeUrl && openedUrl !== attempt.authorizeUrl) {
              openedUrl = attempt.authorizeUrl
              let embedded = false
              try {
                const opened = await requestJson(SIGNIN_WINDOW_PATH, { method: 'POST', body: JSON.stringify({ url: attempt.authorizeUrl }) })
                embedded = !!(opened && opened.embedded === true)
              } catch { /* 窗口路由不可用，回退下方 */ }
              if (!embedded) {
                // The harness runs under ELECTRON_RUN_AS_NODE, so the host
                // cannot create a BrowserWindow. The desktop shell trusts
                // loopback URLs and only guards its own main window: opening
                // this bridge in a popup yields a real in-app window that
                // 302s to the official page. Keep the handle to close it.
                let win = null
                try {
                  win = window.open(
                    LOGIN_WINDOW_PATH + '?url=' + encodeURIComponent(attempt.authorizeUrl),
                    '_blank',
                    'width=430,height=680'
                  )
                } catch { win = null }
                if (win && win.closed !== true) {
                  signWindowRef.current = win
                  embedded = true
                } else {
                  try { window.open(attempt.authorizeUrl, '_blank') } catch { /* link fallback below */ }
                }
              }
              setSignIn((prev) => ({ ...(prev || {}), id: attempt.id, authorizeUrl: attempt.authorizeUrl, embedded }))
            }
            if (snapshot.status === 'credential-stored' && attempt && attempt.phase === 'succeeded') {
              stopped = true
              clearInterval(timer)
              try { await requestJson(SIGNIN_WINDOW_CLOSE_PATH, { method: 'POST', body: '{}' }) } catch { /* 窗口已自行关闭 */ }
              closeLoginWindow()
              const replaceId = reloginIdRef.current
              reloginIdRef.current = null
              try {
                await requestJson(SAVE_PATH, { method: 'POST', body: JSON.stringify(replaceId ? { replaceId } : {}) })
                setNotice(replaceId ? t('reloginDone') : t('signedInNew'))
                if (replaceId) setTimeout(() => window.location.reload(), 900)
              } catch (e) {
                setError(String((e && e.message) || e))
              }
              setSignIn(null)
              refresh()
            } else if (!attempt && snapshot.status === 'signed-out') {
              stopped = true
              clearInterval(timer)
              reloginIdRef.current = null
              setSignIn(null)
              setNotice(t('signInCancelled'))
              refresh()
            }
          } catch { /* transient poll errors ignored */ }
        }, 1500)
        return () => { stopped = true; clearInterval(timer); closeLoginWindow() }
      }, [signIn !== null, ops, refresh, t, closeLoginWindow])

      const runAction = async (key, action) => {
        if (busy) return
        setBusy(key)
        setError(null)
        setNotice(null)
        try {
          await action()
        } catch (e) {
          setError(String((e && e.message) || e))
        } finally {
          setBusy(null)
          refresh()
        }
      }

      const saveCurrent = () => runAction('save', async () => {
        await requestJson(SAVE_PATH, { method: 'POST', body: '{}' })
        setNotice(t('signedInNew'))
      })

      const startAdd = () => runAction('signin', async () => {
        if (state && state.current && !state.current.saved) {
          await requestJson(SAVE_PATH, { method: 'POST', body: '{}' })
        }
        if (!ops || !ops.startSignIn) throw new Error(t('remoteUnavailable'))
        reloginIdRef.current = null
        await ops.startSignIn()
        setSignIn({ id: null, authorizeUrl: null })
      })

      const relogin = (entry) => runAction('signin', async () => {
        if (!ops || !ops.startSignIn) throw new Error(t('remoteUnavailable'))
        reloginIdRef.current = entry.id
        await ops.startSignIn()
        setSignIn({ id: null, authorizeUrl: null })
      })

      const cancelSignIn = () => runAction('signin-cancel', async () => {
        if (ops && signIn && signIn.id) {
          try { await ops.cancelSignIn(signIn.id) } catch { /* attempt may be gone */ }
        }
        reloginIdRef.current = null
        try { await requestJson(SIGNIN_WINDOW_CLOSE_PATH, { method: 'POST', body: '{}' }) } catch { /* 窗口已自行关闭 */ }
        closeLoginWindow()
        setSignIn(null)
        setNotice(t('signInCancelled'))
      })

      const switchTo = (entry) => {
        if (!window.confirm(t('confirmSwitch'))) return
        runAction('switch:' + entry.id, async () => {
          await requestJson(SWITCH_PATH, { method: 'POST', body: JSON.stringify({ id: entry.id }) })
          setNotice(t('switchedRefresh'))
          setTimeout(() => window.location.reload(), 900)
        })
      }

      const removeAccount = (entry) => runAction('remove:' + entry.id, async () => {
        if (!window.confirm(t('confirmRemove'))) return
        await requestJson(REMOVE_PATH, { method: 'POST', body: JSON.stringify({ id: entry.id }) })
      })

      const togglePin = (entry) => runAction('pin:' + entry.id, async () => {
        await requestJson(PIN_PATH, { method: 'POST', body: JSON.stringify({ id: entry.id, pinned: !entry.pinned }) })
        setNotice(entry.pinned ? t('unpinned') : t('pinned'))
      })

      const toggleKeepAlive = (entry) => runAction('keepalive:' + entry.id, async () => {
        const next = entry.keepAlive === false
        await requestJson(KEEPALIVE_PATH, { method: 'POST', body: JSON.stringify({ id: entry.id, keepAlive: next }) })
        setNotice(next ? t('keepAliveOn') : t('keepAliveOff'))
      })

      const checkAll = () => runAction('check', async () => {
        const result = await requestJson(CHECK_PATH, { method: 'POST', body: '{}' })
        if (result && Array.isArray(result.accounts)) {
          const checked = result.accounts.filter((row) => row.keepAlive !== false)
          const online = checked.filter((row) => !row.invalid).length
          setNotice(t('checkDone').replace('{online}', String(online)).replace('{total}', String(checked.length)))
        }
      })

      const [renamingId, setRenamingId] = React.useState(null)
      const [renameValue, setRenameValue] = React.useState('')
      const renameAccount = (entry) => {
        if (busy) return
        setRenamingId(entry.id)
        setRenameValue(entry.alias || '')
      }
      const confirmRename = () => {
        const targetId = renamingId
        if (!targetId) return
        runAction('rename:' + targetId, async () => {
          await requestJson(RENAME_PATH, { method: 'POST', body: JSON.stringify({ id: targetId, name: renameValue }) })
          setRenamingId(null)
          setNotice(t('renamed'))
        })
      }
      const cancelRename = () => { setRenamingId(null) }

      const current = state ? state.current : null
      const accounts = state ? state.accounts : []
      // Pinned first, then newest added.
      const sorted = [...accounts].sort((a, b) =>
        ((b.pinned === true) - (a.pinned === true)) || ((b.addedAt || 0) - (a.addedAt || 0)))
      const meta = state ? state.meta : null

      return jsx('div', { className: 'asw-section', 'data-asw-version': LIB_VERSION, children: [
        jsx('h2', { className: 'asw-title', children: t('title') }, 'title'),
        jsx('p', { className: 'asw-intro', children: t('intro') }, 'intro'),
        error ? jsx('p', { className: 'asw-error', children: error }, 'error') : null,
        notice ? jsx('p', { className: 'asw-notice', children: notice }, 'notice') : null,
        !state && !error ? jsx('p', { className: 'asw-empty', children: t('loading') }, 'loading') : null,

        jsx('div', { className: 'asw-card', children: [
          jsx('div', { className: 'asw-card-head', children: [
            jsx('span', { className: 'asw-label', children: t('current') }, 'label'),
            jsx('div', { className: 'asw-actions', children: [
              jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: refresh, children: t('refresh') }, 'refresh'),
              current && !current.saved
                ? jsx('button', { className: 'asw-btn asw-btn-primary', disabled: busy !== null, onClick: saveCurrent, children: busy === 'save' ? t('saving') : t('saveCurrent') }, 'save')
                : null
            ] }, 'actions')
          ] }, 'head'),
          current
            ? jsx('div', { className: 'asw-row', children: [
                jsx(Avatar, { url: current.avatarUrl, name: current.name }, 'avatar'),
                jsx('div', { className: 'asw-main', children: [
                  jsx('div', { className: 'asw-name', children: current.alias || current.name || current.id }),
                  jsx('div', { className: 'asw-sub', children: [current.alias ? current.name : null, current.contact, t('fingerprint') + ' ' + current.id, current.saved ? t('saved') : null].filter(Boolean).join(' · ') })
                ] }, 'main'),
                jsx('span', { className: 'asw-badge asw-badge-active', children: t('active') }, 'badge')
              ] }, 'row')
            : jsx('p', { className: 'asw-empty', children: t('notSignedIn') }, 'empty')
        ] }, 'current'),

        signIn
          ? jsx('div', { className: 'asw-card', children: [
              jsx('div', { className: 'asw-label', children: t('addAccount') }, 'label'),
              jsx('p', { className: 'asw-intro', children: signIn.embedded ? t('signInAppHint') : t('signInHint') }, 'hint'),
              signIn.authorizeUrl
                ? jsx('a', { className: 'asw-link', href: signIn.authorizeUrl, target: '_blank', rel: 'noreferrer', children: t('signInLink') }, 'link')
                : null,
              jsx('div', { className: 'asw-actions', children:
                jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: cancelSignIn, children: t('signInCancel') }, 'cancel')
              }, 'actions')
            ] }, 'signin')
          : jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: startAdd, children: busy === 'signin' ? '…' : t('addAccount') }, 'add'),

        jsx('div', { className: 'asw-card', children: [
          jsx('div', { className: 'asw-card-head', children: [
            jsx('span', { className: 'asw-label', children: t('library') }, 'label'),
            jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: checkAll, children: busy === 'check' ? t('checking') : t('checkAll') }, 'check')
          ] }, 'head'),
          sorted.length === 0
            ? jsx('p', { className: 'asw-empty', children: t('empty') }, 'empty')
            : jsx('div', { className: 'asw-list', children: sorted.map((entry) =>
                jsx(AccountRow, { t, entry, busy, onSwitch: switchTo, onRemove: removeAccount, onRename: renameAccount, onPin: togglePin, onKeepAlive: toggleKeepAlive, onRelogin: relogin, renaming: renamingId === entry.id, renameValue: renamingId === entry.id ? renameValue : '', onRenameChange: setRenameValue, onRenameConfirm: confirmRename, onRenameCancel: cancelRename }, entry.id)
              ) }, 'list')
        ] }, 'library'),

        jsx('p', { className: 'asw-hint', children: t('hint') }, 'hint'),
        meta ? jsx('p', { className: 'asw-meta', children:
          t('meta') + ': ' + meta.lib + ' · ' + (meta.total || 0) + ' accounts · ' + (meta.store || '') + ' · ' + formatTime(meta.checkedAt)
        }, 'meta') : null,

        jsx('div', { className: 'asw-footer', children:
          jsx('a', { className: 'asw-repo', href: REPO_URL, target: '_blank', rel: 'noreferrer', title: t('repo'), children: [
            jsx('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': 'true', children:
              jsx('path', { d: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z' }, 'mark')
            }, 'icon'),
            jsx('span', { children: 'GitHub' }, 'label')
          ] }, 'repo')
        }, 'footer')
      ] }, 'root')
    }

    const apply = (ctx) => {
      injectStyle()

      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-desktop-account-switcher: locale')

      const clientMeta = () => ({
        version: CLIENT_VERSION,
        locale: ctx.locale.getSnapshot().active,
        timezoneOffsetSeconds: -(new Date()).getTimezoneOffset() * 60
      })
      const callbackOrigin = () => {
        const transport = globalThis.__DSH_TRANSPORT__
        return transport && transport.streamBaseUrl !== undefined
          ? new URL(transport.streamBaseUrl).origin
          : window.location.origin
      }

      const ops = {
        getState: async () => {
          const result = await ctx.remote.account.getState()
          if (!result || result.ok !== true) throw new Error('account state unavailable')
          return result.value ?? null
        },
        startSignIn: async () => {
          const result = await ctx.remote.account.startSignIn(clientMeta(), callbackOrigin(), 'desktop')
          if (!result || result.ok !== true) throw new Error('account start failed')
        },
        cancelSignIn: async (attemptId) => {
          const result = await ctx.remote.account.cancelSignIn(attemptId)
          if (!result || result.ok !== true) throw new Error('account cancel failed')
        }
      }

      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'account-switcher',
        order: -5,
        label: () => t('nav'),
        locale: NS,
        inject: () => ({ ops })
      }, AswBoundary))
    }

    return { apply, inject: ['slots', 'locale', 'remote', 'remote.account'] }
  }
})
