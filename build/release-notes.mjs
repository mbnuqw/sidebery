/* eslint no-console: off */

import fs from 'fs/promises'

const changelogReleaseTitleRE = /(\n|^)## .+(\n|$)/g
const issueRE =
  /\[(?<issueNumber>#\d\d?\d?\d?\d?)\]\(https:\/\/github\.com\/mbnuqw\/sidebery\/(issues|pull)\/\d\d?\d?\d?\d?\)/g
const loginRE = /\[(?<login>@[a-zA-Z0-9-_]+)\]\(https:\/\/github\.com\/[a-zA-Z0-9-_]+\)/g
const contribRE = /(?<login>@[a-zA-Z0-9-_]+): (?<prNumber>#\d\d?\d?\d?\d?)/g

const changelogContent = await fs.readFile('./CHANGELOG.md', { encoding: 'utf-8' })
const releaseNotes = createReleaseNotes(changelogContent)
if (releaseNotes) await writeToFiles(releaseNotes)

function createReleaseNotes(changelogContent) {
  // Cut out changelog part for release
  let reResult = changelogReleaseTitleRE.exec(changelogContent)
  let startIndex = changelogReleaseTitleRE.lastIndex
  if (!reResult) throw 'Cannot parse changelog 1'

  reResult = changelogReleaseTitleRE.exec(changelogContent)
  if (!reResult) throw 'Cannot parse changelog 2'
  let endIndex = changelogReleaseTitleRE.lastIndex - (reResult[0]?.length ?? 0)

  if (endIndex - startIndex < 16) {
    startIndex = endIndex

    reResult = changelogReleaseTitleRE.exec(changelogContent)
    if (!reResult) throw 'Cannot parse changelog 3'
    endIndex = changelogReleaseTitleRE.lastIndex - (reResult[0]?.length ?? 0)
  }

  let releaseNotes = changelogContent.slice(startIndex, endIndex).trim()
  if (!releaseNotes) {
    // eslint-disable-next-line no-console
    console.log('\nResult is empty string')
    return
  }

  // Replace markdown links with Github notation
  releaseNotes = releaseNotes.replace(issueRE, (_, a) => a)
  releaseNotes = releaseNotes.replace(loginRE, (_, a) => a)

  // Replace ### with ## titles
  releaseNotes = releaseNotes.replace(/(\n|^)### /g, (_, a) => `${a}## `)

  // Get contributions
  const contributions = new Map()
  while ((reResult = contribRE.exec(releaseNotes))) {
    const login = reResult.groups?.login
    const prNumber = reResult.groups?.prNumber
    if (!login || !prNumber) continue

    let prs = contributions.get(login)
    if (!prs) {
      prs = new Set()
      contributions.set(login, prs)
    }
    prs.add(prNumber)
  }

  // Create "Contributions" part
  if (contributions.size > 0) {
    releaseNotes += '\n\n## Contributions'
    for (const [login, prs] of contributions) {
      releaseNotes += `\n- ${login}: ${Array.from(prs).join(', ')}`
    }
  }

  return releaseNotes + '\n'
}

async function writeToFiles(releaseNotes) {
  const path = `./build/tmp.${Date.now()}.release-notes.md`
  await fs.writeFile(path, releaseNotes, { encoding: 'utf-8' })
  console.log('Release notes created:', path)
}
