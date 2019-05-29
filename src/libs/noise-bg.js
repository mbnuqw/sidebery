const CACHE = {}
const DefaultCanvasWidth = 128
const DefaultCanvasHeight = 128
const DefaultGrayRange = [0, 255]
const DefaultAlphaRange = [0, 100]

/**
 *  Generate random value
 *
 * > min: number - min uint value
 * > max: number - max uint value
 * < number
 **/
function getRandCh(range, isMonochrome) {
  if (isMonochrome) return range
  return Math.floor(Math.random() * (range[1] - range[0])) + range[0]
}

/**
 *  Normalize 8-bit range/value
 *
 * > range: Array|number - range or static value
 * < Array|number
 **/
function normalizeByteRange(range) {
  if (typeof range === 'number') {
    if (range < 0 || range > 255) range = 127
    return range
  } else if (Array.isArray(range) && range.length === 2) {
    if (range[0] < 0 || range[0] > 255) range[0] = DefaultGrayRange[0]
    if (range[1] < 0 || range[1] > 255) range[1] = DefaultGrayRange[1]
    return range
  } else {
    return DefaultGrayRange
  }
}

/**
 *  Create canvas
 *
 * > width: number - canvas width
 * > height: number - canvas heihgt
 * < Element - canvas
 **/
function createCanvas(width, height) {
  // Canvas box
  let canvasBoxEl = document.createElement('div')
  canvasBoxEl.style.position = 'absolute'
  canvasBoxEl.style.overflow = 'hidden'
  canvasBoxEl.style.opacity = '0'
  canvasBoxEl.style.top = 0
  canvasBoxEl.style.left = 0
  canvasBoxEl.style.width = '1px'
  canvasBoxEl.style.height = '1px'
  document.body.appendChild(canvasBoxEl)

  // Canvas
  let canvasEl = document.createElement('canvas')
  canvasEl.width = width
  canvasEl.height = height
  canvasBoxEl.appendChild(canvasEl)

  return canvasEl
}

/**
 *  Generate grayscale noise
 *
 * > imgData: ...
 * > r: Array|number - red range/value
 * > g: Array|number - green range/value
 * > b: Array|number - blue range/value
 * > a: Array|number - alpha range/value
 **/
function generateNoise(imgData, r, g, b, a, s) {
  let monoR = typeof r === 'number'
  let monoG = typeof g === 'number'
  let monoB = typeof b === 'number'
  let monoA = typeof a === 'number'
  let monoS = typeof s === 'number'
  let i = getRandCh(s, monoS) * 4

  if (r === g && r === b) {
    // Grayscale
    for (; i < imgData.data.length; i += getRandCh(s, monoS) * 4 + 4) {
      imgData.data[i] = getRandCh(r, monoR)
      imgData.data[i + 1] = imgData.data[i]
      imgData.data[i + 2] = imgData.data[i]
      imgData.data[i + 3] = getRandCh(a, monoA)
    }
  } else {
    // RGB
    for (; i < imgData.data.length; i += getRandCh(s, monoS) * 4 + 4) {
      imgData.data[i] = getRandCh(r, monoR)
      imgData.data[i + 1] = getRandCh(g, monoG)
      imgData.data[i + 2] = getRandCh(b, monoB)
      imgData.data[i + 3] = getRandCh(a, monoA)
    }
  }
}

/**
 *  Noise Background
 *
 * > target: string|Element - selector string or element
 * > [conf]: {
 *     [width]: number - canvas width
 *     [height]: number - canvas height
 *     [gray]: Array|number - grayscale range/value
 *     [red]: Array|number - red channel range/value
 *     [green]: Array|number - green channel range/value
 *     [blue]: Array|number - blue channel range/value
 *     [alpha]: Array|number - alpha channel range/value
 *     [spread]: Array|number - distance between noise pixels in stroke
 *   }
 **/
export function noiseBg(target, conf = {}) {
  // Check args
  if (!target) throw new Error(`Target is: ${target}`)

  // Check in cache
  let cKey = JSON.stringify(conf)
  if (CACHE[cKey]) {
    // Add background to target
    if (typeof target === 'string') {
      let styleEl = document.createElement('style')
      document.head.appendChild(styleEl)
      let stylShit = styleEl.sheet
      stylShit.insertRule(`${target} { background-image: url(${CACHE[cKey]}); }`, 0)
    } else if (target.nodeType === 1) {
      target.style.backgroundImage = `url(${CACHE[cKey]})`
    }
    return
  }

  // Setup config
  let width = conf.width || DefaultCanvasWidth
  let height = conf.height || DefaultCanvasHeight

  let redRange = normalizeByteRange(conf.red == null ? conf.gray : conf.red)
  let greenRange = normalizeByteRange(conf.green == null ? conf.gray : conf.green)
  let blueRange = normalizeByteRange(conf.blue == null ? conf.gray : conf.blue)
  let alphaRange = normalizeByteRange(conf.alpha || DefaultAlphaRange)
  let spread = conf.spread || 0

  // Setup canvas
  let canvasEl = createCanvas(width, height)
  let ctx = canvasEl.getContext('2d')
  let raw = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)

  // Generte noise and put in canvas
  generateNoise(raw, redRange, greenRange, blueRange, alphaRange, spread)
  ctx.putImageData(raw, 0, 0)

  // Get base64 image data and store it in cache
  // let img = canvasEl.toDataURL(`image/png`, 1)
  let img = canvasEl.mozGetAsFile('bg.png')
  img = URL.createObjectURL(img)
  CACHE[cKey] = img

  // Add background to target
  if (typeof target === 'string') {
    let styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    let stylShit = styleEl.sheet
    stylShit.insertRule(`${target} { background-image: url(${img}); }`, 0)
  } else if (target.nodeType === 1) {
    target.style.backgroundImage = `url(${img})`
  }
}
