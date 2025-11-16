;(function (): boolean {
  const audioEls = document.querySelectorAll('audio')
  const videoEls = document.querySelectorAll('video')

  let pausedElCount = 0

  if (audioEls && audioEls.length) {
    for (const el of audioEls) {
      if (el.currentTime === 0 || el.ended) continue
      if (el.paused && el.hasAttribute('data-sidebery-media-paused')) {
        pausedElCount++
      }
    }
  }

  if (videoEls && videoEls.length) {
    for (const el of videoEls) {
      if (el.currentTime === 0 || el.ended) continue
      if (el.paused && el.hasAttribute('data-sidebery-media-paused')) {
        pausedElCount++
      }
    }
  }

  return pausedElCount > 0
})()
