import * as SelectionActions from 'src/services/selection.actions'

export const Selection = {
  selected: [] as ID[],

  ...SelectionActions,

  [Symbol.iterator](): Iterator<ID> {
    let index = -1
    const list = Selection.selected

    return {
      next: () => ({ value: list[++index], done: !(index in list) }),
    }
  },
}
