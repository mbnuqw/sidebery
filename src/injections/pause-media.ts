;(function (): boolean {
  const audioEls = document.querySelectorAll('audio')
  const videoEls = document.querySelectorAll('video')

  const pausedEls: HTMLMediaElement[] = []

  if (audioEls && audioEls.length) {
    for (const el of audioEls) {
      if (el.currentTime === 0 || el.ended) continue
      if (el.paused) {
        el.removeAttribute('data-sidebery-media-paused')
        continue
      }
      el.pause()
      pausedEls.push(el)
    }
  }

  if (videoEls && videoEls.length) {
    for (const el of videoEls) {
      if (el.currentTime === 0 || el.ended) continue
      if (el.paused) {
        el.removeAttribute('data-sidebery-media-paused')
        continue
      }
      el.pause()
      pausedEls.push(el)
    }
  }

  // Globaly store "ids" of paused elements and mark them
  for (const el of pausedEls) {
    el.setAttribute('data-sidebery-media-paused', 'true')
  }

  return pausedEls.length > 0
})()
