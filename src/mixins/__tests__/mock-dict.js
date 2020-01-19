if (!global.window) global.window = {}
if (!global.window.locales) global.window.locales = {}
global.window.locales.en = {
  a: { message: 'A' },
  min: {
    message: ['минута', 'минуты', 'минут'],
    plur: [/^(1|(\d*?)[^1]1)$/, /^([234]|(\d*?)[^1][234])$/],
  },
}
