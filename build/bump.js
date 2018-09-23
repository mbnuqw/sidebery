const fs = require('fs')
const cmd = process.argv[process.argv.length - 1]

const VER_RE = /"version"\: "(\d+)\.(\d+)\.(\d+)"/
const TARGETS = ['./package.json', './addon/manifest.json']

for (const targetPath of TARGETS) {
  console.log(` Target: ${targetPath}`)
  let target = fs.readFileSync(targetPath, 'utf-8')
  fs.writeFileSync(targetPath, Bump(target))
}

function Bump(target) {
  target = target.replace(VER_RE, (_, maj, min, patch) => {
    console.log(`   Previous version: ${maj}.${min}.${patch}`)
    if (cmd.indexOf('maj') !== -1) maj++
    else if (cmd.indexOf('min') !== -1) min++
    else patch++
    console.log(`   Current version: ${maj}.${min}.${patch}`)
    return `"version": "${maj}.${min}.${patch}"`
  })
  VER_RE.lastIndex = 0
  return target
}
