import Logs from './logs'

describe('Logs', () => {
  test('Debug and Error messages in dev', () => {
    process.env.NODE_ENV = 'development'
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
    }

    Logs.D('logs')
    Logs.E('error', new Error('badabum'))
    expect(global.console.log).toBeCalled()
    expect(global.console.error).toBeCalled()
  })

  test('Debug and Error messages in prod', () => {
    process.env.NODE_ENV = 'production'
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
    }

    Logs.D('logs')
    Logs.E('error', new Error('badabum'))
    expect(global.console.log).not.toBeCalled()
    expect(global.console.error).not.toBeCalled()
  })
})