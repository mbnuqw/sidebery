import CommonActions from '../../actions/containers'

/**
 * Update containers data (on storage change)
 */
function updateContainers(newContainers) {
  if (!newContainers) return
  this.state.containers = newContainers

  this.state.ctxMenuIgnoreContainersRules = {}
  if (this.state.ctxMenuIgnoreContainers) {
    let rules = this.actions.parseCtxMenuContainersRules(this.state.ctxMenuIgnoreContainers)
    if (rules) {
      for (let container of Object.values(this.state.containers)) {
        let ignore = this.actions.checkCtxMenuContainer(container, rules)
        this.state.ctxMenuIgnoreContainersRules[container.id] = ignore
      }
    }
  }
}

export default {
  ...CommonActions,

  updateContainers,
}
