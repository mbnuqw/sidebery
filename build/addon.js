/* eslint no-console: off */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

const UPDATE_URL = 'https://raw.githubusercontent.com/mbnuqw/sidebery/v5/updates.json'

async function main() {
  // Parse arguments
  const versionRE = /^\d\d?\.\d\d?\.\d\d?\.?\d?\d?\d?$/
  const version = process.argv[process.argv.length - 1]
  const versionParts = version.split('.')
  const isStable = versionParts.length === 3
  const isNightly = versionParts.length === 4
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
    console.log(`Updating version${isNightly ? ' and update_url' : ''} in manifest.json...`)
    let manifestContent = await fs.readFile('./src/manifest.json', { encoding: 'utf-8' })
    const manifest = JSON.parse(manifestContent)
    manifest.version = version
    if (isNightly) manifest.browser_specific_settings.gecko.update_url = UPDATE_URL
    manifestContent = JSON.stringify(manifest, undefined, '  ') + '\n'
    await fs.writeFile('./src/manifest.json', manifestContent, { encoding: 'utf-8' })
  } catch {
    console.log('\nCannot update version and update_url in manifest.json')
    return
  }

  // Delete folder './addon' and './dist/sidebery-X.zip'
  console.log(`Removing ./addon and ./dist/sidebery-${version}.zip...`)
  await fs.rm('./addon', { force: true, recursive: true })
  await fs.rm(`./dist/sidebery-${version}.zip`, { force: true })

  // Build ('build')
  console.log('Preparing code...')
  let buildIsOk = false
  try {
    execSync(`node ./build/all.vite.js`, { encoding: 'utf-8', stdio: 'inherit' })
    buildIsOk = true
  } catch (err) {
    console.log('\nCannot build addon')
    console.log(err)
  }

  // Lint addon
  if (buildIsOk && isStable) {
    console.log('Linting addon...')
    try {
      execSync(`npx web-ext lint --source-dir ./addon`, { encoding: 'utf-8', stdio: 'inherit' })
    } catch (err) {
      console.log('\nCannot lint addon')
      console.log(err)
      buildIsOk = false
    }
  }

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
  if (revertVersion || isNightly) {
    try {
      console.log('Reverting data in manifest.json...')
      let manifestContent = await fs.readFile('./src/manifest.json', { encoding: 'utf-8' })
      const manifest = JSON.parse(manifestContent)
      if (revertVersion) manifest.version = prevVersion
      if (isNightly) delete manifest.browser_specific_settings.gecko.update_url
      manifestContent = JSON.stringify(manifest, undefined, '  ') + '\n'
      await fs.writeFile('./src/manifest.json', manifestContent, { encoding: 'utf-8' })
    } catch {
      console.log('\nCannot revert changes in manifest.json')
      return
    }
  }

  // Stop here if build is not ok
  if (!buildIsOk) return

  // Create './dist/sidebery-X.zip' ('build.ext')
  console.log('Creating addon archive...')
  execSync('npx web-ext build --source-dir ./addon -a ./dist/ -i __tests__', {
    encoding: 'utf-8',
    stdio: 'inherit',
  })

  // Print file sizes
  console.log('Recent build sizes:')
  try {
    const verRe = /(\d+\.\d+\.\d+(?:\.\d*)?)/
    const buildRe = /^sidebery-.+\.zip$/
    const safeParseInt = s => {
      const n = parseInt(s)
      return isNaN(n) || !n ? 0 : n
    }
    const files = await fs.readdir('./dist', { withFileTypes: true })
    const buildFiles = files.filter(f => f.isFile() && buildRe.test(f.name))
    const recentBuildFiles = buildFiles
      .sort((a, b) => {
        const av = (verRe.exec(a.name)?.[0] ?? '0').split('.').map(safeParseInt)
        const bv = (verRe.exec(b.name)?.[0] ?? '0').split('.').map(safeParseInt)
        if (av[0] !== bv[0]) return bv[0] - av[0]
        if (av[1] !== bv[1]) return (bv[1] ?? 0) - (av[1] ?? 0)
        if (av[2] !== bv[2]) return (bv[2] ?? 0) - (av[2] ?? 0)
        if (av[3] !== bv[3]) return (bv[3] ?? 0) - (av[3] ?? 0)
      })
      .slice(0, 10)
    for (const file of recentBuildFiles) {
      const stats = await fs.stat(path.join(file.parentPath, file.name))
      const currentCursor = file.name.includes(version) ? '> ' : '  '
      console.log(`${currentCursor}${file.name}: ${sizeToString(stats.size)}`)
    }
  } catch (err) {
    console.log('\nUnable to list file sizes')
    console.log(err)
  }

  // Sign
  if (isNightly && sign) {
    console.log('Signing addon...')

    if (!process.env.WEB_EXT_API_KEY || !process.env.WEB_EXT_API_SECRET) {
      console.log('\nNo API key or secret')
      return
    }

    execSync('npx web-ext sign --channel unlisted --source-dir ./addon -a ./dist/ -i __tests__', {
      encoding: 'utf-8',
      stdio: 'inherit',
    })
  }
}

process.on('SIGINT', async () => {
  // Wait before exit, so temporary changed files have time to revert
  await new Promise(ok => setTimeout(ok, 1000))
  process.exit(0)
})

await main()

function sizeToString(bytes) {
  if (bytes < 1000) return `${bytes} b`

  const kb = bytes / 1024
  if (kb < 10) return `${Math.round(kb * 100) / 100} kb`
  if (kb < 100) return `${Math.round(kb * 10) / 10} kb`
  if (kb < 1000) return `${Math.round(kb)} kb`

  const mb = bytes / 1048576
  if (mb < 10) return `${Math.round(mb * 100) / 100} mb`
  if (mb < 100) return `${Math.round(mb * 10) / 10} mb`
  if (mb < 1000) return `${Math.round(mb)} mb`

  const gb = bytes / 1073741824
  if (gb < 10) return `${Math.round(gb * 100) / 100} gb`
  if (gb < 100) return `${Math.round(gb * 10) / 10} gb`
  return `${Math.round(gb)} gb`
}
