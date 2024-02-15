/* eslint no-console: off */

import fs from 'fs/promises'
import { Blob } from 'buffer'
import { execSync } from 'child_process'

const OWNER = 'mbnuqw'
const REPO = 'sidebery'
const BRANCH = 'v5'
const MAX_ASSETS_COUNT = 3
const ADDON_ID = '{3c078156-979c-498b-8990-85f7987dd929}'
const CONSIDERED_COMMIT_PREFIXES_RE = /^(fix|feat|perf)/
const ASSET_RE = /sidebery-(\d\d?\.\d\d?\.\d\d?\.\d?\d?\d?)\.xpi/

const gitLogFlags = `--date-order --abbrev-commit --decorate --format=format:'%H::%s' ${BRANCH}`
const updatesGitlogFlags = `--date-order --format=format:'%H' -n 1 ${BRANCH} -- ./updates.json`

async function main() {
  console.log('')

  // Check availability of secrets
  console.log('Checking availability of secrets...')
  if (!process.env.GITHUB_TOKEN) throw 'No GITHUB_TOKEN'
  if (!process.env.WEB_EXT_API_KEY) throw 'No WEB_EXT_API_KEY'
  if (!process.env.WEB_EXT_API_SECRET) throw 'No WEB_EXT_API_SECRET'

  // Get info from manifest.json and updates.json
  console.log('Getting info from manifest.json and updates.json...')
  const amoVersion = await getAMOVersion()
  const updatesContent = await readUpdates()
  const updates = parseUpdates(updatesContent)
  const lastVerDigits = getLastVersionDigits(updates, amoVersion)
  const newVersion = getNewVersion(lastVerDigits)
  console.log('New version:', newVersion)

  // Get info from git
  console.log('Getting info from git...')
  const updatesLastCommit = execSync(`git log ${updatesGitlogFlags}`, { encoding: 'utf-8' })
  console.log('Last commit of "updates.json":', updatesLastCommit)
  const gitlogResult = execSync(`git log ${gitLogFlags}`, { encoding: 'utf-8' })
  const noChanges = !hasUsefullCommitsSinceLastUpdate(gitlogResult, updatesLastCommit)
  if (noChanges) throw 'No changes'

  // Build and sign
  console.log('Building and signing...')
  execSync(`node ./build/addon.mjs --sign ${newVersion}`)

  // Get the last github release
  console.log('Getting the last github release...')
  const ghRelease = await getGHRelease(amoVersion)

  // Remove the third version of asset leaving the last two
  await removeOldestAsset(ghRelease)

  // Upload the new version as an asset and get the direct link for that .xpi file
  const newVersionLink = await uploadNewVersion(ghRelease, newVersion)
  if (!newVersionLink) throw 'No link for new version'

  // Update the 'updates.json' and 'README.md' files
  console.log('Updating "updates.json" and "README.md"...')
  await updateFiles(updates, newVersion, newVersionLink)

  // Commit changes ('updates.json' and 'README.md') and push
  console.log('Commiting and pushing...')
  execSync('git add updates.json README.md', { encoding: 'utf-8', stdio: 'inherit' })
  execSync(`git commit -m "chore: v${newVersion} nightly update"`, {
    encoding: 'utf-8',
    stdio: 'inherit',
  })
  execSync('git push', { encoding: 'utf-8', stdio: 'inherit' })
}

async function getAMOVersion() {
  let content
  try {
    content = await fs.readFile('./src/manifest.json', { encoding: 'utf-8' })
  } catch {
    throw 'Cannot read ./src/manifest.json'
  }

  let manifest
  try {
    manifest = JSON.parse(content)
  } catch {
    throw 'Cannot parse manifest'
  }

  const amoVersion = manifest?.version
  if (!amoVersion) throw 'Wrong AMO version'

  return amoVersion
}

async function readUpdates() {
  let content
  try {
    content = await fs.readFile('./updates.json', { encoding: 'utf-8' })
  } catch {
    throw 'Cannot read updates.json'
  }

  if (!content) throw 'updates.json is empty'

  return content
}

function parseUpdates(updatesContent) {
  let updates
  try {
    updates = JSON.parse(updatesContent)
  } catch {
    throw 'Cannot parse updates.json'
  }

  const versions = updates?.addons?.[ADDON_ID]?.updates
  if (!versions || !versions.length) throw 'Wrong format of updates.json'

  return updates
}

function getLastVersionDigits(updates, amoVersion) {
  const versions = updates.addons[ADDON_ID].updates
  const lastVerInfo = versions[versions.length - 1]
  let lastVer = lastVerInfo.version
  if (typeof lastVer !== 'string') throw 'Wrong type of last version'

  if (!lastVer.startsWith(amoVersion)) {
    lastVer = amoVersion + '.0'
  }

  const verDigits = lastVer.split('.').map(n => parseInt(n))
  if (!verDigits || verDigits.length !== 4 || verDigits.some(n => isNaN(n))) {
    throw 'Wrong format of last version'
  }

  return verDigits
}

function getNewVersion(lastVersionDigits) {
  const ver = [...lastVersionDigits]
  ver[3]++
  return ver.join('.')
}

function hasUsefullCommitsSinceLastUpdate(gitlogString, updatesCommit) {
  const gitlog = gitlogString.split('\n')

  for (const line of gitlog) {
    const commit = line.trim()

    if (commit.startsWith(updatesCommit)) break

    let [, subject] = commit.split('::')
    subject = subject.trim()
    if (CONSIDERED_COMMIT_PREFIXES_RE.test(subject)) return true
  }

  return false
}

async function getGHRelease(amoVersion) {
  const fetchUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/v${amoVersion}`
  const response = await fetch(fetchUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  try {
    return await response.json()
  } catch {
    throw 'getLastGHRelease: Cannot parse response json'
  }
}

async function removeOldestAsset(ghRelease) {
  const assets = ghRelease.assets
  if (assets.length < MAX_ASSETS_COUNT) return

  let rmID
  let rmName
  let minN = 999
  for (const asset of assets) {
    const result = ASSET_RE.exec(asset.name)
    if (!result || !result[1]) continue
    const assetVer = result[1]
    const digits = assetVer.split('.').map(n => parseInt(n))
    if (digits.length !== 4 || digits.some(n => isNaN(n))) continue
    if (digits[3] < minN) {
      minN = digits[3]
      rmID = asset.id
      rmName = asset.name
    }
  }

  if (rmID === undefined || rmName === undefined) return

  console.log(`Removing last asset if there are more than ${MAX_ASSETS_COUNT - 1}: ${rmName}...`)

  await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${rmID}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
}

async function uploadNewVersion(ghRelease, newVersion) {
  const fileName = `sidebery-${newVersion}.xpi`
  const filePath = `./dist/${fileName}`
  const file = await fs.readFile(filePath)

  const url = `https://uploads.github.com/repos/${OWNER}/${REPO}/releases/${ghRelease.id}/assets?name=${fileName}`
  console.log(`Uploading "${fileName}"...`)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      // 'Content-Type': 'application/octet-stream',
      'Content-Type': 'application/x-xpinstall',
    },
    body: new Blob([file]),
  })

  let newAsset
  try {
    newAsset = await response.json()
  } catch {
    throw 'uploadNewVersion: Cannot parse response json'
  }

  return newAsset.browser_download_url
}

async function updateFiles(updates, newVersion, newVersionLink) {
  // Create new version for updates.json
  updates.addons[ADDON_ID].updates.push({
    version: newVersion,
    update_link: newVersionLink,
  })
  const updatesJSON = JSON.stringify(updates, undefined, '  ')
  await fs.writeFile('./updates.json', updatesJSON, { encoding: 'utf-8' })

  // Update README.md
  let readmeContent = await fs.readFile('README.md', { encoding: 'utf-8' })
  readmeContent = readmeContent.replace(
    /\*\*Nightly\*\* \(v\d\.\d\d?\.\d\d?\.\d\d?\d?\):/g,
    `**Nightly** (v${newVersion}):`
  )
  readmeContent = readmeContent.replace(
    /\[Install\]\(https:\/\/github\.com\/mbnuqw\/sidebery\/releases\/download.*\)/g,
    `[Install](${newVersionLink})`
  )
  await fs.writeFile('./README.md', readmeContent, { encoding: 'utf-8' })
}

await main()
