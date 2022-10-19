import { InstanceType, GroupedTabInfo } from 'src/types'

export interface MsgUpdated {
  name: 'update'
  windowId: ID
  instanceType: InstanceType
  id: ID
  index: number
  len: number
  parentId: ID
  tabs: GroupedTabInfo[]
}

export type MsgTabCreated = {
  name: 'create'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

export type MsgTabUpdated = {
  name: 'updateTab'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

export type MsgTabRemoved = {
  name: 'remove'
  windowId: ID
  instanceType: InstanceType
} & GroupedTabInfo

export type Msg = MsgUpdated | MsgTabCreated | MsgTabUpdated | MsgTabRemoved
