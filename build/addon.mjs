/* eslint no-console: off */

import fs from 'fs/promises'
import { execSync } from 'child_process'

const UPDATE_URL = 'https://raw.githubusercontent.com/mbnuqw/sidebery/v5/updates.json'

async function main() {
  // Parse arguments
  const versionRE = /^\d\d?\.\d\d?\.\d\d?\.?\d?\d?\d?$/
  const version = process.argv[process.argv.length - 1]
  const is4Digit = version.split('.').length === 4
  const preserveVersion = process.argv.some(arg => arg === '--preserve')
  const sign = process.argv.some(arg => arg === '--sign')
  if (!versionRE.test(version)) {
    console.log('\nWrong target version (the last argument)')
    return
  }

  console.log('')

  // Set 'X' version in package.json, package-lock.json and manifest.json
  let prevVersion
  try {
    console.log('Updating version in package.json...')
    let packageContent = await fs.readFile('./package.json', { encoding: 'utf-8' })
    const pkg = JSON.parse(packageContent)
    prevVersion = pkg.version
    pkg.version = version
    packageContent = JSON.stringify(pkg, undefined, '  ') + '\n'
    await fs.writeFile('./package.json', packageContent, { encoding: 'utf-8' })
  } catch {
    console.log('\nCannot update version in package.json')
    return
  }
  try {
    console.log('Updating version in package-lock.json...')
    let packageLockContent = await fs.readFile('./package-lock.json', { encoding: 'utf-8' })
    const pkgLock = JSON.parse(packageLockContent)
    pkgLock.version = version
    pkgLock.packages[''].version = version
    packageLockContent = JSON.stringify(pkgLock, undefined, '  ') + '\n'
    await fs.writeFile('./package-lock.json', packageLockContent, { encoding: 'utf-8' })
  } catch {
    console.log('\nCannot update version in package-lock.json')
    return
  }
  try {
    console.log(`Updating version${is4Digit ? ' and update_url' : ''} in manifest.json...`)
    let manifestContent = await fs.readFile('./src/manifest.json', { encoding: 'utf-8' })
    const manifest = JSON.parse(manifestContent)
    manifest.version = version
    if (is4Digit) manifest.browser_specific_settings.gecko.update_url = UPDATE_URL
    manifestContent = JSON.stringify(manifest, undefined, '  ') + '\n'
    await fs.writeFile('./src/manifest.json', manifestContent, { encoding: 'utf-8' })
  } catch {
    console.log('\nCannot revert changes in manifest.json')
    return
  }

  // Delete folder './addon' and './dist/sidebery-X.zip'
  console.log(`Removing ./addon and ./dist/sidebery-${version}.zip...`)
  await fs.rm('./addon', { force: true, recursive: true })
  await fs.rm(`./dist/sidebery-${version}.zip`, { force: true })

  // Build ('build')
  console.log('Preparing code...')
  execSync('node ./build/all.js', { encoding: 'utf-8', stdio: 'inherit' })

  // Revert version in package.json, package-lock.json and manifest.json
  const revertVersion = !preserveVersion && prevVersion && version !== prevVersion
  if (revertVersion) {
    try {
      console.log('Reverting version in package.json...')
      let packageContent = await fs.readFile('./package.json', { encoding: 'utf-8' })
      const pkg = JSON.parse(packageContent)
      pkg.version = prevVersion
      packageContent = JSON.stringify(pkg, undefined, '  ') + '\n'
      await fs.writeFile('./package.json', packageContent, { encoding: 'utf-8' })
    } catch {
      console.log('\nCannot revert version in package.json')
      return
    }
    try {
      console.log('Reverting version in package-lock.json...')
      let packageLockContent = await fs.readFile('./package-lock.json', { encoding: 'utf-8' })
      const pkgLock = JSON.parse(packageLockContent)
      pkgLock.version = prevVersion
      pkgLock.packages[''].version = prevVersion
      packageLockContent = JSON.stringify(pkgLock, undefined, '  ') + '\n'
      await fs.writeFile('./package-lock.json', packageLockContent, { encoding: 'utf-8' })
    } catch {
      console.log('\nCannot revert version in package-lock.json')
      return
    }
  }
  if (revertVersion || is4Digit) {
    try {
      console.log('Reverting data in manifest.json...')
      let manifestContent = await fs.readFile('./src/manifest.json', { encoding: 'utf-8' })
      const manifest = JSON.parse(manifestContent)
      if (revertVersion) manifest.version = prevVersion
      if (is4Digit) delete manifest.browser_specific_settings.gecko.update_url
      manifestContent = JSON.stringify(manifest, undefined, '  ') + '\n'
      await fs.writeFile('./src/manifest.json', manifestContent, { encoding: 'utf-8' })
    } catch {
      console.log('\nCannot revert changes in manifest.json')
      return
    }
  }

  // Create './dist/sidebery-X.zip' ('build.ext')
  console.log('Creating addon archive...')
  execSync('npx web-ext build --source-dir ./addon -a ./dist/ -i __tests__', {
    encoding: 'utf-8',
    stdio: 'inherit',
  })

  // Sign
  if (is4Digit && sign) {
    console.log('Signing addon...')

    if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
      console.log('\nNo API key or secret')
      return
    }

    execSync(
      'npx web-ext sign --use-submission-api --channel unlisted --source-dir ./addon -a ./dist/ -i __tests__',
      {
        encoding: 'utf-8',
        stdio: 'inherit',
      }
    )
  }
}

await main()
