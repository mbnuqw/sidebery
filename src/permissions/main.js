// Load settings and set theme
void (async function() {
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let theme = settings ? settings.theme : 'dark'
  document.body.classList.add('-' + theme)
})()

// Translation
void (async function() {
  document.title = browser.i18n.getMessage('permissions.all_urls.title')
  const logoEl = document.getElementById('logo')
  if (logoEl) logoEl.innerText = browser.i18n.getMessage('permissions.all_urls.logo')
  const msgEl = document.getElementById('msg')
  if (msgEl) msgEl.innerText = browser.i18n.getMessage('permissions.all_urls.msg')
  const btnEl = document.getElementById('req_btn')
  if (btnEl) {
    const permName = btnEl.getAttribute('data-perm')
    btnEl.innerText = browser.i18n.getMessage(`permissions.${permName}.btn`)
  }
  const noteEl = document.getElementById('note')
  if (noteEl) noteEl.innerText = browser.i18n.getMessage('permissions.all_urls.note')
})()

// Permission requesting
void (async function() {
  const reqBtnEl = document.getElementById('req_btn')
  if (!reqBtnEl) return

  // Get permissions
  const origins = []
  const permissions = []
  let perm = reqBtnEl.getAttribute('data-perm')
  if (perm === 'all_urls') origins.push('<all_urls>')
  else if (perm) permissions.push(perm)

  reqBtnEl.addEventListener('click', () => {
    browser.permissions.request({ origins, permissions }).then(() => {
      browser.runtime.sendMessage({ action: 'reloadOptPermissions' })
      browser.tabs.getCurrent().then(tab => browser.tabs.remove([tab.id]))
    })
  })
})()
