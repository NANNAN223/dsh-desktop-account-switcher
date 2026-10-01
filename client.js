/**
 * dsh-desktop-account-switcher — client half.
 * Adds a "账号切换 / Accounts" section to the desktop Settings page.
 */
window.__ModuleLoader__.load({
  id: 'dsh-desktop-account-switcher',
  factory: (require) => {
    const React = require('react')
    const jsxrt = require('react/jsx-runtime')
    // jsxrt is the module namespace (official bundles keep it and read .jsx/.jsxs off it).
    // Pick jsxs for array children, honoring the optional key like the raw runtime.
    const jsx = (type, props, key) => (props && Array.isArray(props.children) ? jsxrt.jsxs : jsxrt.jsx)(type, props, key)

    const STATE_PATH = '/dsh-desktop/account-switcher/state'
    const SAVE_PATH = '/dsh-desktop/account-switcher/save'
    const SWITCH_PATH = '/dsh-desktop/account-switcher/switch'
    const REMOVE_PATH = '/dsh-desktop/account-switcher/remove'
    const RENAME_PATH = '/dsh-desktop/account-switcher/rename'
    const NS = 'settings.accountSwitcher'
    const LIB_VERSION = 'asw-6'

    const zh = {
      nav: '账号切换',
      title: 'DeepSeek 账号切换',
      intro: '保存多个 DeepSeek 账号，随时一键切换推理使用的账号。',
      hint: '切换立即生效，当前对话会改用新账号。账号令牌只保存在本机。',
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
      remove: '删除',
      invalid: '已失效',
      addAccount: '登录新账号…',
      signInHint: '浏览器窗口已打开授权页，完成登录后这里会自动继续。',
      signInLink: '打不开窗口？点这里手动打开授权链接。',
      signInCancel: '取消登录',
      signedInNew: '登录成功，新账号已加入账号库。',
      signInCancelled: '登录已取消或未完成。',
      confirmSwitch: '切换到这个账号？当前对话会改用它继续。',
      refresh: '刷新',
      loading: '加载中…',
      remoteUnavailable: '登录服务不可用，暂时无法发起新账号登录。',
      rename: '备注',
      renameSave: '保存',
      renameCancel: '取消',
      renamePlaceholder: '输入备注名…',
      renamed: '已更新备注名。',
      confirmRemove: '确定要从账号库删除这个账号吗？'
    }
    const en = {
      nav: 'Accounts',
      title: 'DeepSeek account switching',
      intro: 'Save several DeepSeek accounts and switch the active one anytime.',
      hint: 'Switching applies immediately; new requests use the selected account. Tokens stay on this machine.',
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
      remove: 'Remove',
      invalid: 'Expired',
      addAccount: 'Sign in with another account…',
      signInHint: 'A browser window opened for authorization. This panel continues automatically.',
      signInLink: 'Window did not open? Click here to open the authorization link.',
      signInCancel: 'Cancel sign-in',
      signedInNew: 'Signed in. The new account was added to the library.',
      signInCancelled: 'Sign-in was cancelled or did not finish.',
      confirmSwitch: 'Switch to this account? Ongoing conversations will use it from now on.',
      refresh: 'Refresh',
      loading: 'Loading…',
      remoteUnavailable: 'Sign-in service is unavailable; cannot start a new account sign-in right now.',
      rename: 'Rename',
      renameSave: 'Save',
      renameCancel: 'Cancel',
      renamePlaceholder: 'Enter a display name…',
      renamed: 'Name updated.'
    }
    // keep confirmRemove only in zh
    en.confirmRemove = 'Remove this account from the library?'

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
      '.asw-link { font-size: 12px; color: var(--dsw-alias-brand-primary, #4d6bfe); }'
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

    const AccountRow = ({ t, entry, busy, onSwitch, onRemove, onRename, renaming, renameValue, onRenameChange, onRenameConfirm, onRenameCancel }) => {
      const isBusy = busy !== null
      return jsx('div', { className: 'asw-card', children:
        jsx('div', { className: 'asw-row', children: [
          jsx(Avatar, { url: entry.avatarUrl, name: entry.name }, 'avatar'),
          jsx('div', { className: 'asw-main', children: [
            jsx('div', { className: 'asw-name', children: entry.alias || entry.name || entry.id }),
            jsx('div', { className: 'asw-sub', children: [entry.addedAt ? t('addedAt') + ' ' + formatTime(entry.addedAt) : null, entry.alias ? entry.name : null, entry.contact, t('fingerprint') + ' ' + entry.id].filter(Boolean).join(' · ') })
          ] }, 'main'),
          entry.active ? jsx('span', { className: 'asw-badge asw-badge-active', children: t('active') }, 'badge') : null,
          entry.invalid && !entry.active ? jsx('span', { className: 'asw-badge asw-badge-invalid', children: t('invalid') }, 'badge') : null,
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
            jsx('button', {
              className: 'asw-btn asw-btn-primary',
              disabled: isBusy || entry.active || entry.invalid,
              onClick: () => onSwitch(entry),
              children: busy === 'switch:' + entry.id ? t('switching') : t('switchTo')
            }, 'switch'),
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

      const refresh = React.useCallback(async () => {
        try {
          setState(await requestJson(STATE_PATH))
          setError(null)
        } catch (e) {
          setError(String((e && e.message) || e))
        }
      }, [ops])

      React.useEffect(() => { refresh() }, [refresh])

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
              setSignIn((prev) => ({ ...(prev || {}), id: attempt.id, authorizeUrl: attempt.authorizeUrl }))
              try { window.open(attempt.authorizeUrl, '_blank') } catch { /* link fallback below */ }
            }
            if (snapshot.status === 'credential-stored' && attempt && attempt.phase === 'succeeded') {
              stopped = true
              clearInterval(timer)
              try {
                await requestJson(SAVE_PATH, { method: 'POST', body: '{}' })
                setNotice(t('signedInNew'))
              } catch (e) {
                setError(String((e && e.message) || e))
              }
              setSignIn(null)
              refresh()
            } else if (!attempt && snapshot.status === 'signed-out') {
              stopped = true
              clearInterval(timer)
              setSignIn(null)
              setNotice(t('signInCancelled'))
              refresh()
            }
          } catch { /* transient poll errors ignored */ }
        }, 1500)
        return () => { stopped = true; clearInterval(timer) }
      }, [signIn !== null, ops, refresh, t])

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
        setNotice(t('saved'))
      })

      const startAdd = () => runAction('signin', async () => {
        if (state && state.current && !state.current.saved) {
          await requestJson(SAVE_PATH, { method: 'POST', body: '{}' })
        }
        if (!ops || !ops.startSignIn) throw new Error(t('remoteUnavailable'))
        await ops.startSignIn()
        setSignIn({ id: null, authorizeUrl: null })
      })

      const cancelSignIn = () => runAction('signin-cancel', async () => {
        if (ops && signIn && signIn.id) {
          try { await ops.cancelSignIn(signIn.id) } catch { /* attempt may be gone */ }
        }
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
              jsx('p', { className: 'asw-intro', children: t('signInHint') }, 'hint'),
              signIn.authorizeUrl
                ? jsx('a', { className: 'asw-link', href: signIn.authorizeUrl, target: '_blank', rel: 'noreferrer', children: t('signInLink') }, 'link')
                : null,
              jsx('div', { className: 'asw-actions', children:
                jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: cancelSignIn, children: t('signInCancel') }, 'cancel')
              }, 'actions')
            ] }, 'signin')
          : jsx('button', { className: 'asw-btn', disabled: busy !== null, onClick: startAdd, children: busy === 'signin' ? '…' : t('addAccount') }, 'add'),

        jsx('div', { className: 'asw-card', children: [
          jsx('div', { className: 'asw-label', children: t('library') }, 'label'),
          accounts.length === 0
            ? jsx('p', { className: 'asw-empty', children: t('empty') }, 'empty')
            : jsx('div', { className: 'asw-list', children: accounts.map((entry) =>
                jsx(AccountRow, { t, entry, busy, onSwitch: switchTo, onRemove: removeAccount, onRename: renameAccount, renaming: renamingId === entry.id, renameValue: renamingId === entry.id ? renameValue : '', onRenameChange: setRenameValue, onRenameConfirm: confirmRename, onRenameCancel: cancelRename }, entry.id)
              ) }, 'list')
        ] }, 'library'),

        jsx('p', { className: 'asw-hint', children: t('hint') }, 'hint')
      ] }, 'root')
    }

    const apply = (ctx) => {
      injectStyle()

      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-desktop-account-switcher: locale')

      const clientMeta = () => ({
        version: '0.1.7-rc.2',
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
