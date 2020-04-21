import Actions from '../actions'

export default {
  methods: {
    /**
     * Set new value of option and save settings
     */
    setOpt(key, val) {
      Actions.setSetting(key, val)
      Actions.saveSettings()
    },
  },
}
