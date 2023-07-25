import { FavDomain, Stored } from 'src/types'
import * as Logs from 'src/services/logs'
import * as IPC from 'src/services/ipc'
import * as Utils from 'src/utils'
import { Store } from 'src/services/storage'
import { MAX_COUNT_LIMIT, SHARD_SIZE, loadFaviconsData, resizeFavicon } from './favicons'

export * from './favicons'

const SAVE_DELAY = 2000

let saveAll = true
let favicons: string[] = []
let hashes: number[] = []
let domainsInfo: Record<string, FavDomain> = {}
let RC4toRC5 = false

/**
 * Load favicons
 */
export async function loadFavicons(): Promise<void> {
  let favData
  try {
    favData = await loadFaviconsData()
  } catch (err) {
    return Logs.err('loadFavicons: Cannot get favicons', err)
  }

  RC4toRC5 = favData.RC4toRC5

  favicons = []
  hashes = []
  domainsInfo = {}
  let index = 0
  for (const domain of Object.keys(favData.favDomains)) {
    const domainInfo = favData.favDomains[domain]

    // Normalize
    if (domainInfo.index === undefined) continue
    // *** rc4>>rc5
    const srcUrl = (domainInfo as unknown as { src: string }).src
    if (srcUrl) {
      domainInfo.len = srcUrl.length
      delete (domainInfo as unknown as { src?: string }).src
      // rc4>>rc5 ***
    } else if (domainInfo.len === undefined) {
      domainInfo.len = 999
    }

    const favicon = favData.favicons[domainInfo.index]
    const hash = favData.favHashes[domainInfo.index]
    if (!favicon || hash === undefined) continue

    const existedIndex = hashes.indexOf(hash)
    if (existedIndex > -1) {
      domainInfo.index = existedIndex
    } else {
      domainInfo.index = index++
    }

    domainsInfo[domain] = domainInfo
    favicons[domainInfo.index] = favicon
    hashes[domainInfo.index] = hash
  }
}

function saveFaviconsData(
  domainsInfo: Record<string, FavDomain>,
  hashes: number[],
  favicons?: string[],
  index?: number,
  saveAll?: boolean
) {
  const toSave: Stored = { favDomains: domainsInfo, favHashes: hashes }

  if (favicons && index !== undefined && index >= 0) {
    if (saveAll) {
      toSave.favicons_01 = favicons.slice(0, SHARD_SIZE)
      toSave.favicons_02 = favicons.slice(SHARD_SIZE, SHARD_SIZE * 2)
      toSave.favicons_03 = favicons.slice(SHARD_SIZE * 2, SHARD_SIZE * 3)
      toSave.favicons_04 = favicons.slice(SHARD_SIZE * 3, SHARD_SIZE * 4)
      toSave.favicons_05 = favicons.slice(SHARD_SIZE * 4)
    } else {
      const shard = Math.trunc(index / SHARD_SIZE)
      if (shard === 0) toSave.favicons_01 = favicons.slice(0, SHARD_SIZE)
      else if (shard === 1) toSave.favicons_02 = favicons.slice(SHARD_SIZE, SHARD_SIZE * 2)
      else if (shard === 2) toSave.favicons_03 = favicons.slice(SHARD_SIZE * 2, SHARD_SIZE * 3)
      else if (shard === 3) toSave.favicons_04 = favicons.slice(SHARD_SIZE * 3, SHARD_SIZE * 4)
      else toSave.favicons_05 = favicons.slice(SHARD_SIZE * 4, SHARD_SIZE * 5)
    }
  }

  Store.set(toSave)

  if (RC4toRC5) {
    browser.storage.local.remove<Stored>('favicons')
    RC4toRC5 = false
  }
}

function getIndexToReplace(): number {
  const randomIndex = Math.trunc(Math.random() * favicons.length)
  for (const domain of Object.keys(domainsInfo)) {
    const domainInfo = domainsInfo[domain]
    if (domainInfo.index === randomIndex) {
      delete domainsInfo[domain]
    }
  }

  return randomIndex
}

const saveFaviconTimeouts: Record<string, number | undefined> = {}
export function saveFavicon(url: string, icon: string): void {
  if (!url || !icon) return
  if (icon.length > 234567) return
  if (url.startsWith('about')) return

  clearTimeout(saveFaviconTimeouts[url])
  saveFaviconTimeouts[url] = setTimeout(async () => {
    delete saveFaviconTimeouts[url]

    const domain = Utils.getDomainOf(url)
    if (!domain) return

    const domainInfo: FavDomain | undefined = domainsInfo[domain]
    const hash = Utils.strHash(icon)

    let index = hashes.indexOf(hash)
    const iconAlreadyExists = index > -1

    // Domain info exists
    if (domainInfo) {
      // Prefer icon of a page with shorter or the same length URL
      if (domainInfo.len < url.length) {
        return
      }

      // Icon exists and domain is bound to this icon
      if (iconAlreadyExists && index === domainInfo.index) {
        return
      }

      // Icon doesn't exist or it's not bound to this domain
      if (!iconAlreadyExists || index !== domainInfo.index) {
        // Check if another domain uses the same icon index
        const anotherDomainUsesThisIndex =
          domainInfo &&
          Object.values(domainsInfo).find(d => d !== domainInfo && d.index === domainInfo.index)

        // It's the only domain using this index (favicon)
        if (!anotherDomainUsesThisIndex) {
          // Re-use this index (update old favicon)
          index = domainInfo.index
        }
      }
    }

    // Resize icon
    if (!iconAlreadyExists) {
      try {
        icon = await resizeFavicon(icon)
      } catch {
        return
      }
    }

    // Get target index
    if (index === -1) {
      // Replace random existed favicon
      if (favicons.length >= MAX_COUNT_LIMIT) {
        index = getIndexToReplace()
      }
      // Append favicon
      else {
        index = favicons.length
      }
    }

    // Create/Update domain info
    if (!domainInfo) {
      domainsInfo[domain] = { index, len: url.length }
    } else {
      domainInfo.index = index
      domainInfo.len = url.length
    }

    // Set icon, index and hash
    if (!iconAlreadyExists) favicons[index] = icon
    hashes[index] = hash

    if (!iconAlreadyExists || saveAll) {
      saveFaviconsData(domainsInfo, hashes, favicons, index, saveAll)
    } else {
      saveFaviconsData(domainsInfo, hashes)
    }

    saveAll = false

    IPC.sendToSidebars('setFavicon', domain, icon)
  }, SAVE_DELAY)
}

export async function upgradeFaviCache(stored: Stored, newStorage: Stored): Promise<void> {
  let favicons = stored.favicons ?? []
  const favUrls = stored.favUrls ?? {}

  // Limit favicons
  if (favicons.length > MAX_COUNT_LIMIT) {
    favicons = favicons.slice(0, MAX_COUNT_LIMIT)
  }

  // Get urls map
  const urlsMap: Record<number, string> = {}
  for (const url of Object.keys(favUrls)) {
    if (!urlsMap[favUrls[url]]) urlsMap[favUrls[url]] = url
  }

  // Resize
  const newFavs: string[] = []
  const newFavDomains: Record<string, FavDomain> = {}
  const newHashes: number[] = []

  for (let hash, favicon, i = 0; i < favicons.length; i++) {
    favicon = favicons[i]
    if (!favicon) continue

    hash = Utils.strHash(favicon)

    let newFav
    try {
      newFav = await resizeFavicon(favicon)
    } catch {
      continue
    }
    const newIndex = newFavs.push(newFav) - 1
    newHashes.push(hash)
    if (urlsMap[i]) {
      const url = urlsMap[i]
      const domain = Utils.getDomainOf(url)
      if (!newFavDomains[domain]) {
        newFavDomains[domain] = { index: newIndex, len: url.length }
      }
    }
  }

  newStorage.favicons = newFavs
  newStorage.favHashes = newHashes
  newStorage.favDomains = newFavDomains
}
