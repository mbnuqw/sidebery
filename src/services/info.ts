import { InstanceType } from 'src/types'
import * as InfoActions from 'src/services/info.actions'
import { NOID } from 'src/defaults'

interface InfoState {
  os: string
  addonVer: string
}

export const Info = {
  reactive: {
    os: 'unknown',
    addonVer: browser.runtime.getManifest().version,
  } as InfoState,

  instanceType: InstanceType.unknown,
  isSidebar: false,
  isSetup: false,
  isGroup: false,
  isProxy: false,
  isUrl: false,
  isBg: false,
  isSearch: false,
  isPreview: false,

  majorVersion: undefined as number | undefined,
  prevMajorVersion: undefined as number | undefined,
  prevVersion: undefined as string | undefined,

  currentTabId: NOID,

  ...InfoActions,
}
