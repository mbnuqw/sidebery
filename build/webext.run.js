const webExt = require('web-ext')
const fs = require('fs')
const { ADDON_PATH } = require('./utils')

let lastArg = process.argv[process.argv.length - 1]
if (!lastArg || lastArg.startsWith('-')) lastArg = 'firefox'

const IS_FF = lastArg.includes('irefox')
const cliOpts = {
  target: IS_FF ? 'firefox-desktop' : 'chromium',
  sourceDir: ADDON_PATH,
  keepProfileChanges: true,
}

async function main() {
  if (IS_FF) {
    cliOpts.firefox = lastArg
    cliOpts.firefoxProfile = './build/profile-' + lastArg
    await fs.promises.mkdir(cliOpts.firefoxProfile, { recursive: true })
  } else {
    cliOpts.chromiumBinary = lastArg
    cliOpts.chromiumProfile = './build/profile-' + lastArg
    await fs.promises.mkdir(cliOpts.chromiumProfile, { recursive: true })
  }

  webExt.cmd.run(cliOpts, { shouldExitProgram: true })
}
main()
