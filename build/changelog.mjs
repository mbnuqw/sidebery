/* eslint no-console: off */

import fs from 'fs/promises'
import { execSync } from 'child_process'

const owner = 'mbnuqw'
const repo = 'sidebery'
const githubToken = process.env.GITHUB_TOKEN
const gitLogFlags = '--all --branches --remotes --date-order --abbrev-commit --decorate'
const gitLogFormat =
  "--format=format:'::[commit:%H][date:%as][subject:%s]][body:%b]][author:%an][committer:%cn][email:%ae][info:%d]'"
const changelogGitlogFlags =
  "--all --branches --remotes --date-order --format=format:'%H' -n 1 -- ./CHANGELOG.md"
const commitInfoRE =
  /\[commit:(?<commit>.+)\]\[date:(?<date>.+)\]\[subject:(?<subject>.+)\]\]\[body:(?<body>(.|\r?\n)*)\]\]\[author:(?<author>.+)\]\[committer:(?<committer>.+)\]\[email:(?<email>.*)\]\[info:(?<info>.*)\]/m
const versionInCommitRE = /tag: (?<version>v?\d\d?\.\d\d?\.\d\d?)/
const ignoreCommitPrefixRE = /^chore/i
const commitGroups = [
  { re: /^feat\(?(?<subGroup>[a-zA-Z0-9-_ ]*)\)?:(?<msg>.+)/, name: '### Added' },
  { re: /^fix\(?(?<subGroup>[a-zA-Z0-9-_ ]*)\)?:(?<msg>.+)/, name: '### Fixed' },
  {
    re: /^perf\(?(?<subGroup>[a-zA-Z0-9-_ ]*)\)?:(?<msg>.+)/,
    name: '### Performance Improvements',
  },
  { re: /(?<msg>.+)/, name: '### Other' },
]
const taggedIssueRE = /(?<taggedIssue>\([a-zA-Z-_]*:? ?#\d\d?\d?\d?\d?\))/
const replaceIssueRE = /#(\d\d?\d?\d?\d?)/g
const replaceLoginRE = /@([a-zA-Z0-9-_]+)/g

const contributors = new Map()

const changelogLastCommit = await execSync(`git log ${changelogGitlogFlags}`, { encoding: 'utf-8' })
const gitlogResult = await execSync(`git log ${gitLogFlags} ${gitLogFormat}`, { encoding: 'utf-8' })
const commits = parseGitLog(gitlogResult)
const releases = await groupCommits(commits)
const changelog = generateChangelog(releases)
await writeToFiles(changelog)

function parseGitLog(gitlog) {
  const rawCommits = gitlog.split('\n::')
  const commits = []

  for (const rawCommit of rawCommits) {
    const result = commitInfoRE.exec(rawCommit)
    if (!result) throw 'Cannot parse commit message'

    // Stop parsing
    if (result.groups.commit === changelogLastCommit) break

    let info = result.groups.info
    if (info) {
      const verResult = versionInCommitRE.exec(info)
      if (verResult) {
        let commitVersion = verResult.groups.version
        if (commitVersion.startsWith('v')) commitVersion = commitVersion.slice(1)

        result.groups.version = commitVersion
      }
    }

    commits.push({
      commit: result.groups.commit,
      date: result.groups.date,
      subject: result.groups.subject.trim(),
      body: result.groups.body.replace('\r\n', '\n').trim(),
      author: result.groups.author,
      committer: result.groups.committer,
      email: result.groups.email,
      info: result.groups.info.trim(),
      version: result.groups.version,
    })
  }

  return commits
}

async function groupCommits(commits) {
  const releases = []
  let release

  for (const commit of commits) {
    if (commit.version) {
      release.groups = await createGroups(release.commits)
      release = { version: commit.version, date: commit.date, commits: [] }
      releases.push(release)
      continue
    }
    if (!release) {
      release = { commits: [] }
      releases.push(release)
    }

    release.commits.push(commit)
  }

  if (release) release.groups = await createGroups(release.commits)

  return releases
}

async function createGroups(commits) {
  const groups = []

  for (const commitGroup of commitGroups) {
    const group = {
      name: commitGroup.name,
      commits: [],
    }
    groups.push(group)

    for (const commit of commits) {
      if (!commit.name) {
        const reResult = commitGroup.re.exec(commit.subject)
        if (reResult) {
          const reGroups = reResult.groups
          commit.name = await createCommitName(commit, reGroups.subGroup, reGroups.msg)

          if (!commit.prNumber && ignoreCommitPrefixRE.test(commit.subject)) continue

          group.commits.push(commit)
        }
      }
    }
  }

  return groups
}

async function createCommitName(commit, subGroup, msg) {
  msg = msg.trim()
  msg = msg[0].toUpperCase() + msg.slice(1)

  let name
  if (subGroup) name = `${subGroup[0].toUpperCase() + subGroup.slice(1)}: ${msg}`
  else name = msg

  const normCommitter = commit.committer.toLowerCase()
  if (githubToken && commit.author !== 'mbnuqw' && normCommitter.includes('github')) {
    let authorLogin = contributors.get(commit.email)
    if (!authorLogin) {
      commit.login = await getAuthorGithubLogin(commit)
      authorLogin = commit.login
      contributors.set(commit.email, commit.login)
    }

    if (authorLogin) {
      const prNumber = await getPullRequestNumber(commit)
      if (prNumber) {
        commit.prNumber = prNumber
        name = name.replace(`(#${prNumber})`, '').trim()
      }

      name += ` (by @${authorLogin}${prNumber ? `: #${prNumber}` : ''})`
    }
  }

  if (commit.body) {
    const bodyLines = commit.body.split('\n').map((line, i, lines) => {
      line = line.trim()
      const taggedIssueReResult = taggedIssueRE.exec(line)
      if (taggedIssueReResult) {
        const taggedIssue = taggedIssueReResult.groups.taggedIssue
        name += ' ' + taggedIssue
        return ''
      }
      if (line.startsWith('Co-authored-by')) return ''
      if (!line && lines[i - 1]?.startsWith('*') && lines[i + 1]?.startsWith('*')) return ''
      if (line) return '\n  ' + line
      else return '\n' + line
    })

    name += '  ' + bodyLines.join('').replace(/(\n| )+$/, '')
  }

  return name
}

function loginLink(login) {
  return `[@${login}](https://github.com/${login})`
}

function issueLink(issueNumber) {
  return `[#${issueNumber}](https://github.com/${owner}/${repo}/issues/${issueNumber})`
}

async function getAuthorGithubLogin(commit) {
  const fetchUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.commit}`

  const response = await fetch(fetchUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  let responseJSON
  try {
    responseJSON = await response.json()
  } catch {
    // ...
  }

  return responseJSON?.author?.login
}

async function getPullRequestNumber(commit) {
  const fetchUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commit.commit}/pulls`

  const response = await fetch(fetchUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  let responseJSON
  try {
    responseJSON = await response.json()
  } catch {
    // ...
  }

  const number = responseJSON[0]?.number
  if (number) return `${number}`
}

function generateChangelog(releases) {
  let changelog = ''

  for (const release of releases) {
    if (!release.commits.length) continue

    if (release.version) changelog += `\n\n## ${release.version} - ${release.date}\n`
    else changelog += '\n\n## Unreleased\n'

    for (const group of release.groups) {
      if (!group.commits.length) continue

      changelog += `\n${group.name}`

      for (const commit of group.commits) {
        changelog += `\n- ${commit.name}`
      }

      changelog += '\n'
    }
  }

  changelog = changelog.trim() + '\n'

  changelog = changelog.replace(replaceIssueRE, (_, n) => issueLink(n))
  changelog = changelog.replace(replaceLoginRE, (_, n) => loginLink(n))

  return changelog
}

async function writeToFiles(changelog) {
  const path = `./build/tmp.${Date.now()}.changelog.md`
  await fs.writeFile(path, changelog, { encoding: 'utf-8' })
  console.log('Changelog created:', path)
}
