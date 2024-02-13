/* eslint no-console: off */
const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const { parse, compileTemplate, compileScript } = require('@vue/compiler-sfc')
const { IS_DEV, ADDON_PATH, VUE_DIST } = require('./utils')
const { treeToList, getTSConfig, colorize, watch, log, logOk, logErr } = require('./utils')

const forChromium = process.argv.includes('--chromium')
const SRC_DIR = './src'
const OUTPUT_DIR = ADDON_PATH
const NORM_SRC_DIR = path.normalize(SRC_DIR)
const TS_CONFIG = getTSConfig()
const BUNDLES = {
  'src/injections/group.ts': true,
  'src/injections/url.ts': true,
  'src/page.tab-preview/tab-preview.ts': true,
}
const IMPORT_RE = /(^|\n|\r\n|;)(im|ex)port\s?((?:\n|.)*?)\sfrom\s"(\.\.?|src|vue)(\/.+?)?"/g

const ESBUILD_DEFINE = forChromium ? { browser: 'chrome' } : undefined

function fixModuleImports(data) {
  return data.replace(IMPORT_RE, (match, p1, p2, p3, p4, p5) => {
    if (p4 === 'src') return `${p1}${p2}port ${p3} from '${p5}.js'`
    else if (p4 === 'vue') return `${p1}${p2}port ${p3} from '/vendor/${VUE_DIST}'`
    else return `${p1}${p2}port ${p3} from '${p4}${p5}.js'`
  })
}

/**
 * Get list of .ts files
 */
async function getSrcFiles() {
  const result = []
  const files = await treeToList(SRC_DIR)
  for (const f of files) {
    if (!f.file) continue
    const isTS = f.file.endsWith('.ts') && !f.file.endsWith('.d.ts')
    const isVUE = f.file.endsWith('.vue')
    if (!isTS && !isVUE) continue

    const srcPath = path.join(f.dir, f.file)
    const outDir = path.join(OUTPUT_DIR, f.dir.replace(NORM_SRC_DIR, ''))
    const outFile = isTS ? f.file.slice(0, -3) + '.js' : f.file + '.js'
    const outPath = path.join(outDir, outFile)

    result.push({ srcDir: f.dir, srcFile: f.file, srcPath, outDir, outFile, outPath, isTS, isVUE })
  }

  return result
}

/**
 * @type esbuild.Plugin
 */
const vueComponentsPlugin = {
  name: 'vueComponentsPlugin',
  setup: build => {
    build.onResolve({ filter: /^vue$/ }, () => {
      return { path: `/vendor/${VUE_DIST}`, external: true }
    })

    build.onResolve({ filter: /.*\.vue$/ }, args => {
      const impDir = path.dirname(args.importer)

      let fullPath
      if (args.path[0] === '.') fullPath = path.resolve(impDir, args.path)
      else if (args.path.startsWith('src/')) fullPath = path.resolve(args.path)

      return { path: fullPath, namespace: 'vue-component', sideEffects: false }
    })

    build.onLoad({ filter: /.*/, namespace: 'vue-component' }, async args => {
      const resolveDir = path.dirname(args.path)
      const resultCode = await compileVueComponent(args.path, path.basename(args.path))

      return {
        contents: resultCode,
        loader: 'ts',
        resolveDir,
      }
    })
  },
}

const PREPROC_OPTIONS = { pug: { doctype: 'html' } }
function getTemplateOptions(descriptor, bindingMetadata, filePath, fileName) {
  return {
    id: filePath + 'template',
    source: descriptor.template.content,
    isProd: !IS_DEV,
    filename: fileName,
    preprocessLang: descriptor.template.attrs.lang,
    preprocessOptions: PREPROC_OPTIONS[descriptor.template.attrs.lang],
    compilerOptions: {
      bindingMetadata: bindingMetadata,
      filename: fileName + '.html',
      sourceMap: IS_DEV,
      comments: false,
    },
  }
}

/**
 * Compile component
 */
async function compileVueComponent(filePath, fileName) {
  const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' })
  const { descriptor, errors } = parse(fileContent, { filename: filePath, sourceMap: IS_DEV })
  const inlineTemplate = !!descriptor.scriptSetup

  if (errors && errors.length) {
    logErr(`Vue: Error[s] in ${filePath}:`)
    errors.forEach(e => console.log(e.toString()))
    return ''
  }

  // Get script
  let script, bindings
  if (descriptor.scriptSetup) {
    try {
      const result = compileScript(descriptor, {
        id: filePath + 'script',
        isProd: !IS_DEV,
        refSugar: false,
        inlineTemplate,
        templateOptions: getTemplateOptions(descriptor, bindings, filePath, fileName),
      })
      script = result.content
      bindings = result.bindings
    } catch (err) {
      logErr(`Vue: Error[s] in ${filePath}:`)
      console.log(colorize(`|r>${err.toString()}|x|`))
    }
  } else if (descriptor.script) {
    script = descriptor.script?.content.trim()
  }
  if (!script) script = '\nexport default {\n}\n'

  // Compile template into render function
  if (descriptor.template && !inlineTemplate) {
    const result = compileTemplate(getTemplateOptions(descriptor, bindings, filePath, fileName))

    if (result.errors && result.errors.length) {
      logErr(`Vue: Error[s] in ${filePath}:`)
      result.errors.forEach(e => console.log(colorize(`|r>${e.toString()}|x|`)))
      return ''
    }

    // Inject render function
    if (result.code) {
      script =
        result.code +
        '\n' +
        script.replace('export default', 'const _C =') +
        '\n\n_C.render = render' +
        '\nexport default _C'
    }
  }

  return script
}

async function compileTSFile(file) {
  let result
  if (BUNDLES[file.srcPath]) {
    await esbuild.build({
      entryPoints: [file.srcPath],
      tsconfig: 'tsconfig.json',
      charset: 'utf8',
      minify: !IS_DEV,
      treeShaking: true,
      bundle: true,
      format: 'esm',
      outfile: file.outPath,
    })
    return
  } else {
    const codeStr = await fs.promises.readFile(file.srcPath, { encoding: 'utf-8' })
    result = await esbuild.transform(codeStr, {
      tsconfigRaw: { compilerOptions: TS_CONFIG },
      sourcefile: file.srcPath,
      loader: 'ts',
      minify: !IS_DEV,
      charset: 'utf8',
      sourcemap: 'inline',
      define: ESBUILD_DEFINE,
    })
  }
  if (result.warnings && result.warnings.length) {
    logErr(`Vue: Error[s] in ${file.srcPath}:`)
    for (const msg of result.warnings) {
      console.log(colorize(`  |r>${msg.text}|x|`))
      if (msg.location) {
        console.log(colorize(`  |_>${msg.location.line}:|r>${msg.location.lineText}|x|`))
      }
    }
  }
  return result.code
}

async function compileTSCode(codeStr, filePath) {
  const result = await esbuild.transform(codeStr, {
    tsconfigRaw: { compilerOptions: TS_CONFIG },
    sourcefile: filePath,
    loader: 'ts',
    define: ESBUILD_DEFINE,
  })
  if (result.warnings && result.warnings.length) {
    logErr(`Vue: Error[s] in ${filePath}:`)
    for (const msg of result.warnings) {
      console.log(colorize(`  |r>${msg.text}|x|`))
      if (msg.location) {
        console.log(colorize(`  |_>${msg.location.line}:|r>${msg.location.lineText}|x|`))
      }
    }
  }
  return result.code
}

async function writeTSFile(code, fileInfo) {
  if (!code) return
  await fs.promises.mkdir(fileInfo.outDir, { recursive: true })
  await fs.promises.writeFile(fileInfo.outPath, code)
}

async function compile(srcFiles) {
  for (const info of srcFiles) {
    try {
      let resultCode
      if (info.isTS) resultCode = await compileTSFile(info)
      else if (info.isVUE) {
        resultCode = await compileVueComponent(info.srcPath, info.srcFile)
        resultCode = await compileTSCode(resultCode, info.srcPath)
      }
      if (resultCode) {
        resultCode = fixModuleImports(resultCode)
        await writeTSFile(resultCode, info)
      }
    } catch (err) {
      logErr(`Scripts: Cannot build ${info.srcPath}:\n${err}`)
    }
  }
}

async function compileAndWatch(files) {
  await compile(files)

  const tasks = files.map(f => {
    f.files = [f.srcPath]
    return f
  })

  watch(
    tasks,
    async tasks => {
      tasks.forEach(t => log(`Scripts: Changed source: ${t.srcPath}`))
      await compile(tasks)
    },
    (task, file) => {
      log(`Scripts: File ${file} was renamed, restart this script`)
      tasks.forEach(t => t.watchers.forEach(w => w.close()))
    }
  )
}

/**
 * Main
 */
async function main() {
  log('Scripts: Building')

  if (IS_DEV) {
    const files = await getSrcFiles()
    await compileAndWatch(files)
    logOk('Scripts: Watching')
  } else {
    // Splitting allowed code
    await esbuild.build({
      entryPoints: [
        'src/bg/background.ts',
        'src/sidebar/sidebar.ts',
        'src/page.setup/setup.ts',
        'src/popup.proxy/proxy.ts',
        'src/popup.search/search.ts',
        'src/_locales/dict.common.ts',
        'src/_locales/dict.sidebar.ts',
        'src/_locales/dict.setup-page.ts',
      ],
      tsconfig: 'tsconfig.json',
      charset: 'utf8',
      splitting: true,
      minifyWhitespace: true,
      minifySyntax: true,
      treeShaking: true,
      bundle: true,
      format: 'esm',
      outdir: ADDON_PATH,
      plugins: [vueComponentsPlugin],
      define: ESBUILD_DEFINE,
    })
    // Bundled scripts for injecting
    await esbuild.build({
      entryPoints: [
        'src/injections/playMedia.ts',
        'src/injections/pauseMedia.ts',
        'src/injections/group.ts',
        'src/injections/url.ts',
      ],
      tsconfig: 'tsconfig.json',
      charset: 'utf8',
      splitting: false,
      minifyWhitespace: true,
      minifySyntax: true,
      treeShaking: true,
      bundle: true,
      format: 'esm',
      outdir: path.join(ADDON_PATH, 'injections'),
      define: ESBUILD_DEFINE,
    })
    // Bundled script for preview
    await esbuild.build({
      entryPoints: ['src/page.tab-preview/tab-preview.ts'],
      tsconfig: 'tsconfig.json',
      charset: 'utf8',
      splitting: false,
      minifyWhitespace: true,
      minifySyntax: true,
      treeShaking: true,
      bundle: true,
      format: 'esm',
      outdir: path.join(ADDON_PATH, 'page.tab-preview'),
      define: ESBUILD_DEFINE,
    })
    logOk('Scripts: Done')
  }
}
main()
