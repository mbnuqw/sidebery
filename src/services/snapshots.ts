import { Snapshot } from 'src/types'
import * as SnapshotsActions from 'src/services/snapshots.actions'

export interface SnapshotsState {
  list: Snapshot[]
}

export const Snapshots = {
  state: { list: [] } as SnapshotsState,

  ...SnapshotsActions,
}
