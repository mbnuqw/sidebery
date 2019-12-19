let LANG = browser.i18n.getUILanguage().slice(0, 2)
if (!window.locales[LANG]) LANG = 'en'

let dict = window.locales[LANG]

/**
 *  Get dict value
 **/
export function translate(id, plurNum) {
  if (!id) return ''
  if (!dict[id] || dict[id].message === undefined) return id

  if (dict[id].message.constructor === String) return dict[id].message
  if (dict[id].message.constructor === Array) {
    let i
    let record = dict[id]

    for (i = 0; i < record.plur.length; i++) {
      let range = record.plur[i]
      if (range === plurNum) return record.message[i]

      if (range.constructor === Array && range[0] <= plurNum && range[1] >= plurNum) {
        return record.message[i]
      }
      if (range.constructor === RegExp && range.test(plurNum)) {
        return record.message[i]
      }
    }
    return record.message[i]
  }
  return id
}
