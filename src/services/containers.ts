import { Container } from 'src/types'
import * as ContainersActions from 'src/services/containers.actions'
import * as ContainersHandlers from 'src/services/containers.handlers'

export interface ContainersState {
  byId: Record<string, Container>
}

export interface ContainerProxy {
  type: browser.proxy.ProxyType
  host: string
  port: string
}

export const Containers = {
  reactive: { byId: {} } as ContainersState,

  ...ContainersHandlers,
  ...ContainersActions,
}
