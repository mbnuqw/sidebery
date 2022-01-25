import * as WebReqActions from 'src/services/web-req.actions'

export const WebReq = {
  containersProxies: {} as Record<string, browser.proxy.ProxyInfo>,

  ...WebReqActions,
}
