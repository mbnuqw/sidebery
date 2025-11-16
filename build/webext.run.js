import webExt from 'web-ext'
import fs from 'node:fs'
import path from 'node:path'
import { ADDON_PATH } from './utils.js'

let lastArg = process.argv[process.argv.length - 1]
if (!lastArg || lastArg.startsWith('-')) lastArg = 'firefox'

const IS_FF = lastArg.includes('irefox') || lastArg.includes('loorp') || lastArg.includes('zen')
const cliOpts = {
  target: IS_FF ? 'firefox-desktop' : 'chromium',
  sourceDir: ADDON_PATH,
  keepProfileChanges: true,
}

async function main() {
  if (IS_FF) {
    cliOpts.firefox = lastArg
    cliOpts.firefoxProfile = './build/profile-' + path.basename(lastArg).split(".")[0]
    await fs.promises.mkdir(cliOpts.firefoxProfile, { recursive: true })
  } else {
    cliOpts.chromiumBinary = lastArg
    cliOpts.chromiumProfile = './build/profile-' + path.basename(lastArg).split(".")[0]
    await fs.promises.mkdir(cliOpts.chromiumProfile, { recursive: true })
  }

  webExt.cmd.run(cliOpts, { shouldExitProgram: true })
}
main()
