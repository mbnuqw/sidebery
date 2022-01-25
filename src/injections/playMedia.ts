;(function (): void {
  const audioEls = document.querySelectorAll('audio')
  const videoEls = document.querySelectorAll('video')

  if (audioEls && audioEls.length) {
    for (const el of audioEls) {
      if (!el.paused) continue
      const pausedBySidebery = el.getAttribute('data-sidebery-media-paused')
      if (pausedBySidebery) {
        el.removeAttribute('data-sidebery-media-paused')
        el.play()
      }
    }
  }

  if (videoEls && videoEls.length) {
    for (const el of videoEls) {
      if (!el.paused) continue
      const pausedBySidebery = el.getAttribute('data-sidebery-media-paused')
      if (pausedBySidebery) {
        el.removeAttribute('data-sidebery-media-paused')
        el.play()
      }
    }
  }
})()
