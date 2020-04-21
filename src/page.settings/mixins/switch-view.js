export default {
  methods: {
    /**
     * Switch to view of settings page
     *
     * @param {string} name - url hash
     */
    switchView(name) {
      location.hash = name
    },
  },
}
