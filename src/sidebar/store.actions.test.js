import Actions from './store.actions'
import EventBus from './event-bus'

describe('Common actions', () => {
  describe('chooseWin', () => {
    const state = {
      winChoosing: false
    }
  
    test('Choosing window', async () => {
      const choosing = Actions.chooseWin({ state })
      await new Promise(res => setTimeout(res, 10))
  
      // Two windows to choose
      expect(state.winChoosing).toHaveLength(2)
  
      // Choose the first one
      state.winChoosing[0].choose()
  
      const win = await choosing
      expect(win).toBe(123)
    })
  })

  describe('recalcPanelScroll', () => {
    test('just emit global event after 33ms', async () => {
      let counter = 0
      EventBus.$on('recalcPanelScroll', () => counter++)
      Actions.recalcPanelScroll()
      await new Promise(res => setTimeout(res, 40))
      expect(counter).toBe(1)
    })
  })

  describe('broadcast', () => {
    test('just emit global message', async () => {
      let ans = ''
      EventBus.$on('some-msg', arg => ans = arg)
      Actions.broadcast(null, { name: 'some-msg', arg: 'some-arg' })
      expect(ans).toBe('some-arg')
    })
  })
})