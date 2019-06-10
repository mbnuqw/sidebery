export function initActionsMixin(actions) {
  return {
    methods: {
      act: (actionName, ...args) => actions[actionName](...args),
    },
  }
}
