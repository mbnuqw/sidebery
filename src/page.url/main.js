void async function() {
  // Load settings and set theme
  let ans = await browser.storage.local.get('settings')
  let settings = ans.settings
  let style = settings ? settings.style : 'dark'

  // Set style class
  document.body.setAttribute('data-style', style)

  // Set background noise
  // if (settings.bgNoise) {
  //   noiseBg(document.body, {
  //     width: 300,
  //     height: 300,
  //     gray: [12, 175],
  //     alpha: [0, 66],
  //     spread: [0, 9],
  //   })
  //   let scaleShift = ~~window.devicePixelRatio
  //   let sW = 300 >> scaleShift
  //   let sH = 300 >> scaleShift
  //   document.body.style.backgroundSize = `${sW}px ${sH}px`
  // }

  const hash = location.hash
  if (!hash) return
  const url = hash.slice(1)
  const linkEl = document.getElementById('url')
  linkEl.innerText = url
}()