/**
 * dsh-desktop-account-switcher v2 — host half (asw2-3).
 *
 * v2 additions over v1: pinned flag per account (PIN_PATH), re-login swap
 * (save accepts replaceId: the fresh grant carries over alias/addedAt/pinned
 * from the stale entry and replaces it), and a self-check meta block in state.
 * asw2-2: in-app Electron sign-in window (SIGNIN_WINDOW_PATH) — the official
 * platform sign-in page opens in a frameless BrowserWindow; navigation to
 * /oauth/callback auto-closes it ~1.2s later. Falls back to window.open when
 * electron is unavailable.
 * asw2-3: multi-account keep-alive (CHECK_PATH) — every stored token is
 * probed against /auth-api/v0/users/current shortly after boot and on an
 * interval (default 6h), so the whole library stays verifiably signed in;
 * entries gain checkedAt/lastOkAt and manual per-account/all checks.
 *
 * Library: <DSH_HOME>/account-switcher/accounts.json
 *   { "version": 1, "accounts": [ { id, token, issuer, name, contact,
 *       avatarUrl, alias, addedAt, invalid?, pinned?, checkedAt?, lastOkAt? } ] }
 * Account id = first 12 hex chars of sha256(token).
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const name = 'dsh-desktop-account-switcher'
export const inject = ['credentials']

export const STATE_PATH = '/dsh-desktop/account-switcher/state'
export const SAVE_PATH = '/dsh-desktop/account-switcher/save'
export const SWITCH_PATH = '/dsh-desktop/account-switcher/switch'
export const REMOVE_PATH = '/dsh-desktop/account-switcher/remove'
export const RENAME_PATH = '/dsh-desktop/account-switcher/rename'
export const PIN_PATH = '/dsh-desktop/account-switcher/pin'
export const SIGNIN_WINDOW_PATH = '/dsh-desktop/account-switcher/signin-window'
export const SIGNIN_WINDOW_CLOSE_PATH = '/dsh-desktop/account-switcher/signin-window/close'
export const CHECK_PATH = '/dsh-desktop/account-switcher/check'


/** Credentials record holding the active Platform grant (kind: grant). */
const CREDENTIAL_KEY = 'deepseek-account-platform/default'
const DEFAULT_ISSUER = 'https://platform.deepseek.com'
const PROFILE_TIMEOUT_MS = 8000
const MAX_BODY_BYTES = 64 * 1024
const STORE_VERSION = 1
const LIB_VERSION = 'asw2-3'
// Keep-alive cadence; env overrides exist so tests can shorten them.
const CHECK_BOOT_DELAY_MS = Math.max(0, Number(process.env.DSH_ASW_CHECK_DELAY_MS) || 20 * 1000)
const CHECK_INTERVAL_MS = Math.max(60 * 1000, Number(process.env.DSH_ASW_CHECK_INTERVAL_MS) || 6 * 60 * 60 * 1000)
const CHECK_GAP_MS = 400
const MAX_ALIAS = 40
// Real client version; keep in sync when upgrading DSH.
const CLIENT_VERSION = '0.2.0-rc.2'

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function storeFile(home = dshHome()) {
  return join(home, 'account-switcher', 'accounts.json')
}

function normalizeIssuer(value) {
  try {
    return new URL(String(value)).origin
  } catch {
    return DEFAULT_ISSUER
  }
}

function fingerprint(token) {
  return createHash('sha256').update(String(token)).digest('hex').slice(0, 12)
}

function isLoopback(address) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function hasForwardedAddress(req) {
  return Boolean(
    req.headers.forwarded ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-host']
  )
}

function isTrustedRequest(req, mutation = false) {
  if (!isLoopback(req.socket.remoteAddress) || hasForwardedAddress(req)) return false
  if (!mutation) return true
  const origin = req.headers.origin
  const host = req.headers.host
  if (typeof origin !== 'string' || typeof host !== 'string') return false
  try {
    const parsed = new URL(origin)
    return parsed.protocol === 'http:' && parsed.host === host && isLoopback(parsed.hostname)
  } catch {
    return false
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolveBody) => {
    const chunks = []
    let size = 0
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      resolveBody(value)
    }
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        finish({})
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        const value = text.trim() === '' ? {} : JSON.parse(text)
        finish(value && typeof value === 'object' && !Array.isArray(value) ? value : {})
      } catch {
        finish({})
      }
    })
    req.on('error', () => finish({}))
  })
}

function clientHeaders() {
  let version = CLIENT_VERSION
  try {
    version = createRequire(import.meta.url)('@deepseek-ai/dsh/package.json').version || version
  } catch {
    // keep fallback (module moved into app.asar; resolution may fail here)
  }
  return {
    'x-client-bundle-id': '',
    'x-client-platform': process.platform === 'win32' ? 'desktop-win' : 'desktop-mac',
    'x-client-version': String(version),
    'x-client-locale': 'zh_CN',
    'x-client-timezone-offset': String(-(new Date()).getTimezoneOffset() * 60)
  }
}

/**
 * Read one token's Platform profile without touching stored credentials.
 * @returns { Promise<{ profile?: { name: string|null, contact: string|null, avatarUrl: string|null }, unauthorized?: boolean }> }
 */
async function queryProfile(origin, token) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS)
  try {
    const response = await fetch(new URL('/auth-api/v0/users/current', origin), {
      method: 'GET',
      redirect: 'error',
      signal: controller.signal,
      headers: { ...clientHeaders(), 'x-dsh-auth-token': token }
    })
    if (response.status === 401) return { unauthorized: true }
    if (!response.ok) return {}
    const payload = await response.json()
    const data = payload && typeof payload === 'object'
      ? (payload.biz_data && typeof payload.biz_data === 'object' ? payload.biz_data
        : payload.data && typeof payload.data === 'object' ? payload.data
          : payload)
      : null
    if (!data || typeof data !== 'object') return {}
    const identity = data.id_profile && typeof data.id_profile === 'object' ? data.id_profile : {}
    return {
      profile: {
        name: typeof identity.name === 'string' && identity.name !== '' ? identity.name : null,
        contact: typeof data.mobile === 'string' && data.mobile !== '' ? data.mobile
          : typeof data.mobile_number === 'string' && data.mobile_number !== '' ? data.mobile_number
            : typeof data.email === 'string' && data.email !== '' ? data.email
              : null,
        avatarUrl: typeof identity.picture === 'string' && identity.picture !== '' ? identity.picture : null
      }
    }
  } catch {
    return {}
  } finally {
    clearTimeout(timer)
  }
}

export async function apply(ctx) {
  const home = dshHome()
  const libraryFile = storeFile(home)

  /** Serialized library mutations. */
  let writeChain = Promise.resolve()
  const enqueue = (operation) => {
    const next = writeChain.then(operation, operation)
    writeChain = next.then(() => undefined, () => undefined)
    return next
  }

  const readLibrary = async () => {
    try {
      const text = await readFile(libraryFile, 'utf8')
      const value = JSON.parse(text)
      const accounts = Array.isArray(value?.accounts) ? value.accounts : []
      return {
        version: STORE_VERSION,
        accounts: accounts.filter((row) => row && typeof row.token === 'string' && row.token !== '')
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
      return { version: STORE_VERSION, accounts: [] }
    }
  }

  const writeLibrary = (accounts) => enqueue(async () => {
    await mkdir(dirname(libraryFile), { recursive: true })
    const text = JSON.stringify({ version: STORE_VERSION, accounts }, null, 2) + '\n'
    const temporary = libraryFile + '.tmp-' + process.pid + '-' + Date.now()
    await writeFile(temporary, text, 'utf8')
    await rename(temporary, libraryFile).catch(async (error) => {
      await rm(temporary, { force: true }).catch(() => undefined)
      throw error
    })
  })

  /** In-memory profile cache keyed by account fingerprint. */
  const profileCache = new Map()

  const readActiveGrant = async (credentials) => {
    try {
      const record = await credentials.readRecord(CREDENTIAL_KEY)
      if (!record || record.kind !== 'grant') return null
      const payload = record.payload
      if (!payload || payload.version !== 1 || typeof payload.token !== 'string' || payload.token === '') return null
      const issuer = typeof payload.issuer === 'string' && payload.issuer !== '' ? normalizeIssuer(payload.issuer) : DEFAULT_ISSUER
      return { token: payload.token, issuer }
    } catch {
      return null
    }
  }

  const upsertLibrary = async (grant, profile, carry = null) => {
    const library = await readLibrary()
    const id = fingerprint(grant.token)
    const existing = library.accounts.find((row) => row.id === id)
    const entry = {
      id,
      token: grant.token,
      issuer: grant.issuer ? normalizeIssuer(grant.issuer) : DEFAULT_ISSUER,
      name: profile?.name ?? existing?.name ?? null,
      contact: profile?.contact ?? existing?.contact ?? null,
      avatarUrl: profile?.avatarUrl ?? existing?.avatarUrl ?? null,
      alias: existing?.alias ?? carry?.alias ?? null,
      addedAt: existing?.addedAt ?? carry?.addedAt ?? Date.now()
    }
    const pinned = existing?.pinned === true || carry?.pinned === true
    if (pinned) entry.pinned = true
    if (entry.name !== null) entry.invalid = false
    // Replace the stale entry when re-login carried it over.
    const carryId = carry?.id
    library.accounts = [entry, ...library.accounts.filter((row) => row.id !== id && row.id !== carryId)]
    await writeLibrary(library.accounts)
    profileCache.set(id, { name: entry.name, contact: entry.contact, avatarUrl: entry.avatarUrl })
    return entry
  }

  /** Sequential background refresh of display names for library entries. */
  let refreshTimer
  let refreshing = false
  const scheduleNameRefresh = (delayMs = 400) => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(async () => {
      if (refreshing) return
      refreshing = true
      try {
        const credentials = ctx.credentials
        if (!credentials) return
        const library = await readLibrary()
        const active = await readActiveGrant(credentials)
        const rows = [...library.accounts.map((row) => ({ row, token: row.token, issuer: row.issuer }))]
        if (active && !rows.some((item) => item.row.id === fingerprint(active.token))) {
          rows.push({ row: null, token: active.token, issuer: active.issuer })
        }
        for (const item of rows) {
          const id = fingerprint(item.token)
          const cached = profileCache.get(id)
          if (cached && cached.name !== null && cached.name !== undefined) continue
          if (item.row?.invalid === true && cached) continue
          const outcome = await queryProfile(item.issuer || DEFAULT_ISSUER, item.token)
          if (outcome.unauthorized) {
            profileCache.set(id, { name: null, contact: null, avatarUrl: null, invalid: true })
            if (item.row) {
              item.row.invalid = true
              const libraryNow = await readLibrary()
              await writeLibrary(libraryNow.accounts.map((row) => row.id === id ? { ...row, invalid: true } : row))
            }
            continue
          }
          if (outcome.profile) {
            profileCache.set(id, outcome.profile)
            if (item.row) {
              const libraryNow = await readLibrary()
              await writeLibrary(libraryNow.accounts.map((row) => row.id === id
                ? { ...row, name: outcome.profile.name, contact: outcome.profile.contact, avatarUrl: outcome.profile.avatarUrl, invalid: false }
                : row))
            }
          }
        }
      } catch (error) {
        ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
      } finally {
        refreshing = false
      }
    }, delayMs)
    refreshTimer.unref?.()
  }

  // ---- multi-account keep-alive -------------------------------------------
  // Probing one token = GET /auth-api/v0/users/current with that token. Only
  // an HTTP 401 marks an account invalid; network or protocol hiccups leave
  // the previous status untouched so a flaky connection never logs accounts
  // out on paper. Everything runs through writeLibrary's serialized chain.
  let checkTimer = null
  let checkInterval = null
  let checking = false

  const patchAccount = async (id, patch) => {
    const library = await readLibrary()
    await writeLibrary(library.accounts.map((row) => row.id === id ? { ...row, ...patch } : row))
  }

  const checkAccountRow = async (id) => {
    const library = await readLibrary()
    const row = library.accounts.find((item) => item.id === id)
    if (!row) return null
    const outcome = await queryProfile(row.issuer || DEFAULT_ISSUER, row.token)
    const now = Date.now()
    if (outcome.unauthorized) {
      await patchAccount(id, { checkedAt: now, invalid: true })
      profileCache.set(fingerprint(row.token), { name: null, contact: null, avatarUrl: null, invalid: true })
      return { id, online: false }
    }
    const patch = { checkedAt: now }
    if (outcome.profile) {
      patch.invalid = false
      patch.lastOkAt = now
      patch.name = outcome.profile.name
      patch.contact = outcome.profile.contact
      patch.avatarUrl = outcome.profile.avatarUrl
      profileCache.set(fingerprint(row.token), outcome.profile)
    }
    await patchAccount(id, patch)
    return { id, online: outcome.profile ? true : null }
  }

  const checkAllAccounts = async () => {
    if (checking) return
    checking = true
    try {
      const library = await readLibrary()
      for (const row of library.accounts) {
        await checkAccountRow(row.id)
        await new Promise((resolve) => setTimeout(resolve, CHECK_GAP_MS))
      }
    } catch (error) {
      ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
    } finally {
      checking = false
    }
  }

  const buildState = async (credentials) => {
    const [library, active] = [await readLibrary(), await readActiveGrant(credentials)]
    const activeId = active === null ? null : fingerprint(active.token)
    const displayName = (id) => {
      const entry = library.accounts.find((row) => row.id === id)
      const cached = profileCache.get(id) ?? {}
      return {
        name: cached.name ?? entry?.name ?? null,
        contact: cached.contact ?? entry?.contact ?? null,
        avatarUrl: cached.avatarUrl ?? entry?.avatarUrl ?? null,
        alias: entry?.alias ?? null,
        checkedAt: entry?.checkedAt ?? null,
        lastOkAt: entry?.lastOkAt ?? null,
        invalid: cached.invalid === true || entry?.invalid === true,
        pinned: entry?.pinned === true
      }
    }
    const current = active === null ? null : {
      id: activeId,
      saved: library.accounts.some((row) => row.id === activeId),
      issuer: active.issuer,
      ...displayName(activeId)
    }
    const accounts = library.accounts.map((row) => ({
      id: row.id,
      addedAt: row.addedAt ?? null,
      active: row.id === activeId,
      ...displayName(row.id)
    }))
    return {
      current,
      accounts,
      meta: {
        lib: LIB_VERSION,
        store: libraryFile,
        total: accounts.length,
        checkedAt: Date.now()
      }
    }
  }

  // 应用作用域持有登录窗句柄: 即使 effect 回调被再次调用, 新旧闭包也共享同一窗口引用。
  let loginWindow = null
  let loginWindowCloseTimer = null

  ctx.inject(['webServer'], (webCtx) => webCtx.effect(() => {
    const withCredentials = async (res, operation) => {
      const credentials = ctx.credentials
      if (!credentials || typeof credentials.readRecord !== 'function') {
        sendJson(res, 500, { error: 'credentials service unavailable' })
        return null
      }
      try {
        return await operation(credentials)
      } catch (error) {
        ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
        return null
      }
    }

    const postOnly = (req, res) => {
      if (req.method !== 'POST' || !isTrustedRequest(req, true)) {
        sendJson(res, req.method === 'POST' ? 403 : 405, { error: 'Request rejected.' })
        return true
      }
      return false
    }

    const disposeState = webCtx.webServer.register({
      kind: 'exact',
      path: STATE_PATH,
      handler: async (req, res) => {
        if (req.method !== 'GET' || !isTrustedRequest(req)) {
          sendJson(res, req.method === 'GET' ? 403 : 405, { error: 'Request rejected.' })
          return
        }
        await withCredentials(res, async (credentials) => {
          scheduleNameRefresh()
          sendJson(res, 200, await buildState(credentials))
        })
      }
    })

    const disposeSave = webCtx.webServer.register({
      kind: 'exact',
      path: SAVE_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const active = await readActiveGrant(credentials)
          if (active === null) {
            sendJson(res, 409, { error: '当前没有已登录的账号可保存。' })
            return
          }
          // Re-login swap: carry alias/addedAt/pinned over from the stale entry.
          let carry = null
          const replaceId = typeof body.replaceId === 'string' ? body.replaceId : ''
          if (replaceId !== '') {
            const library = await readLibrary()
            const stale = library.accounts.find((row) => row.id === replaceId)
            if (stale && stale.id !== fingerprint(active.token)) {
              carry = { id: stale.id, alias: stale.alias ?? null, addedAt: stale.addedAt, pinned: stale.pinned === true }
            }
          }
          const entry = await upsertLibrary(active, profileCache.get(fingerprint(active.token)) ?? null, carry)
          scheduleNameRefresh()
          sendJson(res, 200, { ...(await buildState(credentials)), savedId: entry.id, replaced: carry?.id ?? null })
        })
      }
    })

    const disposeSwitch = webCtx.webServer.register({
      kind: 'exact',
      path: SWITCH_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const targetId = typeof body.id === 'string' ? body.id : ''
          const library = await readLibrary()
          const target = library.accounts.find((row) => row.id === targetId)
          if (!target) {
            sendJson(res, 404, { error: '账号库中找不到该账号。' })
            return
          }
          const active = await readActiveGrant(credentials)
          const activeId = active === null ? null : fingerprint(active.token)
          if (activeId === targetId) {
            sendJson(res, 200, await buildState(credentials))
            return
          }
          // Preserve the outgoing grant before it is overwritten.
          if (active !== null && !library.accounts.some((row) => row.id === activeId)) {
            await upsertLibrary(active, profileCache.get(activeId) ?? null)
          }
          await credentials.modifyRecord(CREDENTIAL_KEY, () => ({
            kind: 'grant',
            payload: { version: 1, token: target.token, issuer: target.issuer ? normalizeIssuer(target.issuer) : DEFAULT_ISSUER }
          }))
          scheduleNameRefresh()
          sendJson(res, 200, { ...(await buildState(credentials)), activeId: targetId })
        })
      }
    })

    const disposeRemove = webCtx.webServer.register({
      kind: 'exact',
      path: REMOVE_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const targetId = typeof body.id === 'string' ? body.id : ''
          const active = await readActiveGrant(credentials)
          if (active !== null && fingerprint(active.token) === targetId) {
            sendJson(res, 409, { error: '该账号正在使用中，不能删除。' })
            return
          }
          const library = await readLibrary()
          const remaining = library.accounts.filter((row) => row.id !== targetId)
          if (remaining.length === library.accounts.length) {
            sendJson(res, 404, { error: '账号库中找不到该账号。' })
            return
          }
          await writeLibrary(remaining)
          sendJson(res, 200, await buildState(credentials))
        })
      }
    })

    const disposeRename = webCtx.webServer.register({
      kind: 'exact',
      path: RENAME_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const targetId = typeof body.id === 'string' ? body.id : ''
          const raw = typeof body.name === 'string' ? body.name.trim() : ''
          if (raw.length > MAX_ALIAS) {
            sendJson(res, 400, { error: '备注名过长（最多 40 个字符）。' })
            return
          }
          const library = await readLibrary()
          const target = library.accounts.find((row) => row.id === targetId)
          if (!target) {
            sendJson(res, 404, { error: '账号库中找不到该账号。' })
            return
          }
          const next = library.accounts.map((row) => row.id !== targetId ? row : { ...row, alias: raw === '' ? null : raw })
          await writeLibrary(next)
          sendJson(res, 200, await buildState(credentials))
        })
      }
    })

    const disposePin = webCtx.webServer.register({
      kind: 'exact',
      path: PIN_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const targetId = typeof body.id === 'string' ? body.id : ''
          const library = await readLibrary()
          const target = library.accounts.find((row) => row.id === targetId)
          if (!target) {
            sendJson(res, 404, { error: '账号库中找不到该账号。' })
            return
          }
          const next = library.accounts.map((row) => {
            if (row.id !== targetId) return row
            const updated = { ...row }
            if (body.pinned === true) updated.pinned = true
            else delete updated.pinned
            return updated
          })
          await writeLibrary(next)
          sendJson(res, 200, await buildState(credentials))
        })
      }
    })

    const disposeCheck = webCtx.webServer.register({
      kind: 'exact',
      path: CHECK_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        await withCredentials(res, async (credentials) => {
          const target = typeof body?.id === 'string' && body.id !== '' ? body.id : null
          if (target) {
            const library = await readLibrary()
            if (!library.accounts.some((row) => row.id === target)) {
              sendJson(res, 404, { error: '账号库中找不到该账号。' })
              return
            }
            await checkAccountRow(target)
          } else {
            await checkAllAccounts()
          }
          sendJson(res, 200, { ...(await buildState(credentials)), checked: target || 'all' })
        })
      }
    })

    const SIGNIN_WINDOW_TITLE = 'DeepSeek 登录 / Sign in'

    const isAllowedLoginUrl = (value) => {
      try {
        const parsed = new URL(String(value))
        return parsed.protocol === 'https:' && /(^|\.)deepseek\.com$/i.test(parsed.hostname)
      } catch {
        return false
      }
    }

    const closeSignWindow = () => {
      clearTimeout(loginWindowCloseTimer)
      loginWindowCloseTimer = null
      if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy()
      loginWindow = null
    }

    const watchSignWindowNavigation = (win) => {
      const check = (url) => {
        try {
          if (new URL(url).pathname === '/oauth/callback') {
            // 登录 code 已到达本机交换端点；给平台 302 一点渲染时间后自动关窗。
            clearTimeout(loginWindowCloseTimer)
            loginWindowCloseTimer = setTimeout(() => closeSignWindow(), 1200)
          }
        } catch { /* 非 URL，忽略 */ }
      }
      win.webContents?.on?.('will-redirect', (_event, url) => check(url))
      win.webContents?.on?.('did-navigate', (_event, url) => check(url))
    }

    const openSignWindow = async (body) => {
      const target = typeof body?.url === 'string' ? body.url : ''
      if (!isAllowedLoginUrl(target)) return { ok: false, error: '仅支持打开 DeepSeek 官方登录页。' }
      let electronModule
      try {
        electronModule = await import('electron')
      } catch {
        return { ok: false, fallback: true }
      }
      const ns = electronModule && electronModule.default ? electronModule.default : electronModule
      const BrowserWindow = ns && typeof ns.BrowserWindow === 'function' ? ns.BrowserWindow : null
      if (!BrowserWindow) return { ok: false, fallback: true }
      try {
        closeSignWindow()
        const owner = typeof BrowserWindow.getAllWindows === 'function'
          ? BrowserWindow.getAllWindows().find((candidate) => !candidate.isDestroyed?.() && !candidate.getParentWindow?.())
          : null
        const win = new BrowserWindow({
          width: 430,
          height: 680,
          title: SIGNIN_WINDOW_TITLE,
          autoHideMenuBar: true,
          show: false,
          backgroundColor: '#ffffff',
          ...(owner ? { parent: owner } : {}),
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            spellcheck: false
          }
        })
        win.once('ready-to-show', () => { try { win.show() } catch { /* 窗口已销毁 */ } })
        win.on('closed', () => { if (loginWindow === win) loginWindow = null })
        watchSignWindowNavigation(win)
        await win.loadURL(target)
        loginWindow = win
        return { ok: true, embedded: true }
      } catch (error) {
        ctx.logger?.warn?.(error instanceof Error ? error : new Error(String(error)))
        closeSignWindow()
        return { ok: false, fallback: true }
      }
    }

    const disposeSignWindow = webCtx.webServer.register({
      kind: 'exact',
      path: SIGNIN_WINDOW_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        const body = await readBody(req)
        sendJson(res, 200, await openSignWindow(body))
      }
    })

    const disposeSignWindowClose = webCtx.webServer.register({
      kind: 'exact',
      path: SIGNIN_WINDOW_CLOSE_PATH,
      handler: async (req, res) => {
        if (postOnly(req, res)) return
        await readBody(req)
        closeSignWindow()
        sendJson(res, 200, { ok: true })
      }
    })

    scheduleNameRefresh(1200)

    // Keep-alive: probe the whole library shortly after boot, then on the
    // interval. Timers ride the plugin scope so dispose cancels them.
    checkTimer = setTimeout(() => { void checkAllAccounts() }, CHECK_BOOT_DELAY_MS)
    checkTimer.unref?.()
    checkInterval = setInterval(() => { void checkAllAccounts() }, CHECK_INTERVAL_MS)
    checkInterval.unref?.()

    return () => {
      closeSignWindow()
      clearTimeout(checkTimer)
      clearInterval(checkInterval)
      disposeSignWindowClose()
      disposeSignWindow()
      disposePin()
      disposeCheck()
      disposeRename()
      disposeRemove()
      disposeSwitch()
      disposeSave()
      disposeState()
      clearTimeout(refreshTimer)
    }
  }, 'dsh-desktop-account-switcher: account library routes'))

  ctx.logger?.info?.('[dsh-desktop-account-switcher] v2 routes registered under /dsh-desktop/account-switcher/')
}
