void function() {
  const hash = location.hash
  if (!hash) return
  const url = hash.slice(1)
  const linkEl = document.getElementById('link')
  linkEl.setAttribute('href', url)
  linkEl.innerText = url
}()