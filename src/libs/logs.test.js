import Logs from './logs'

describe('Logs', () => {
  test('Debug and Error messages', () => {
    Logs.D('one', 'two')
    Logs.E('some error', new Error('errr'))

    const jsonStr = Logs.GetJSON()
    const logs = JSON.parse(jsonStr)
    expect(logs).toHaveLength(2)
    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        msg: expect.arrayContaining(['one', 'two']),
        t: expect.any(Number),
      }),
      expect.objectContaining({
        err: expect.stringMatching('Error: errr'),
        msg: expect.stringMatching('some error'),
        t: expect.any(Number),
      })
    ]))
  })
})