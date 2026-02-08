import type { BkmNode } from 'src/services/bookmarks.fg'
import * as Logs from 'src/services/logs'

export type TabLike = { id: ID; url: string }
export type { Link }

class Link {
  readonly url: string
  tabs = new Set<TabLike>()
  bkms = new Set<BkmNode>()

  constructor(url: string) {
    this.url = url
  }
}

export const byUrl = new Map<string, Link>()
export const byTab = new WeakMap<TabLike, Link>()
export const byBkm = new WeakMap<BkmNode, Link>()

export function addTab(tab: TabLike) {
  let link = byUrl.get(tab.url)
  if (!link) byUrl.set(tab.url, (link = new Link(tab.url)))

  link.tabs.add(tab)
  byTab.set(tab, link)

  if (link.bkms.size) link.bkms.forEach(b => b.recalcOpenTabs(link))
}

export function updTab(tab: TabLike, newUrl: string) {
  const oldLink = byUrl.get(tab.url)
  if (oldLink) {
    oldLink.tabs.delete(tab)
    if (oldLink.bkms.size) oldLink.bkms.forEach(b => b.recalcOpenTabs(oldLink))
    else if (!oldLink.tabs.size && !oldLink.bkms.size) byUrl.delete(oldLink.url)
  }

  let newLink = byUrl.get(newUrl)
  if (!newLink) byUrl.set(newUrl, (newLink = new Link(newUrl)))

  newLink.tabs.add(tab)
  byTab.set(tab, newLink)

  if (newLink.bkms.size) newLink.bkms.forEach(b => b.recalcOpenTabs(newLink))
}

export function rmTab(tab: TabLike) {
  let link = byTab.get(tab)
  if (!link) {
    link = byUrl.get(tab.url)
    if (!link) return
  }

  link.tabs.delete(tab)
  if (link.bkms.size) link.bkms.forEach(b => b.recalcOpenTabs(link))
  else if (!link.tabs.size && !link.bkms.size) byUrl.delete(link.url)
}

export function rmAllTabs() {
  for (const [_, link] of byUrl) {
    link.tabs.clear()
    if (link.bkms.size) link.bkms.forEach(b => b.recalcOpenTabs(link))
    else if (!link.tabs.size && !link.bkms.size) byUrl.delete(link.url)
  }
}

export function addBkm(bkm: BkmNode): Link | undefined {
  if (!bkm.url) return

  let link = byUrl.get(bkm.url)
  if (!link) byUrl.set(bkm.url, (link = new Link(bkm.url)))
  byBkm.set(bkm, link)

  link.bkms.add(bkm)

  return link
}

export function updBkm(bkm: BkmNode, newUrl: string): Link | undefined {
  if (!bkm.url) return

  const oldLink = byUrl.get(bkm.url)
  if (oldLink) {
    oldLink.bkms.delete(bkm)
    if (!oldLink.tabs.size && !oldLink.bkms.size) byUrl.delete(oldLink.url)
  }

  let newLink = byUrl.get(newUrl)
  if (!newLink) byUrl.set(newUrl, (newLink = new Link(newUrl)))

  newLink.bkms.add(bkm)
  byBkm.set(bkm, newLink)

  return newLink
}

export function rmBkm(bkm: BkmNode): Link | undefined {
  if (!bkm.url) return

  let link = byBkm.get(bkm)
  if (!link) {
    link = byUrl.get(bkm.url)
    if (!link) return
  }

  link.bkms.delete(bkm)
  if (!link.tabs.size && !link.bkms.size) byUrl.delete(link.url)

  return link
}

export function rmAllBkms() {
  for (const [_, link] of byUrl) {
    link.bkms.clear()
    if (!link.tabs.size && !link.bkms.size) byUrl.delete(link.url)
  }
}
