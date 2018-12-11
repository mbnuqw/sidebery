// Translation
void (async function() {
  document.title = browser.i18n.getMessage('permissions.all_urls.title')
  const logoEl = document.getElementById('logo')
  if (logoEl) logoEl.innerText = browser.i18n.getMessage('permissions.all_urls.logo')
  const msgEl = document.getElementById('msg')
  if (msgEl) msgEl.innerText = browser.i18n.getMessage('permissions.all_urls.msg')
  const btnEl = document.getElementById('req_btn')
  if (btnEl) btnEl.innerText = browser.i18n.getMessage('permissions.all_urls.btn')
  const noteEl = document.getElementById('note')
  if (noteEl) noteEl.innerText = browser.i18n.getMessage('permissions.all_urls.note')
})()

// Permission requesting
void (async function() {
  const reqBtnEl = document.getElementById('req_btn')
  if (!reqBtnEl) return

  // Get origins (currently only <all_urls>)
  const origins = []
  if (reqBtnEl.getAttribute('data-orig')) origins.push('<all_urls>')

  // Get permissions
  const permissions = []
  let perm = reqBtnEl.getAttribute('data-perm')
  if (perm) permissions.push(perm)

  reqBtnEl.addEventListener('click', () => {
    browser.permissions.request({ origins, permissions }).then(() => {
      browser.runtime.reload()
    })
  })
})()
