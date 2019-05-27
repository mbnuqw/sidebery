import EventBus from './event-bus'

describe('Global event-bus', () => {
  test('passing global messages', () => {
    let counter = 0
    EventBus.$on('some-event', n => counter += n)
    browser.runtime.sendMessage({ arg: 5 })
    browser.runtime.sendMessage({ name: 'some-event', arg: 5 })
    expect(counter).toBe(5)
  })
})