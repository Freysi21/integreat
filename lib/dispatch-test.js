import test from 'ava'
import sinon from 'sinon'

import dispatch from './dispatch'

// Tests -- actions

test('should exist', (t) => {
  t.is(typeof dispatch, 'function')
})

test('should route to GET action', async (t) => {
  const action = {
    type: 'GET',
    payload: {
      source: 'entries',
      id: 'ent1',
      type: 'entry'
    }
  }
  const actions = {
    'GET': async () => ({status: 'ok', data: [{id: 'ent1', type: 'entry'}]})
  }

  const ret = await dispatch({actions})(action)

  t.is(ret.status, 'ok')
  t.deepEqual(ret.data, [{id: 'ent1', type: 'entry'}])
})

test('should return status noaction when no action', async (t) => {
  const action = null
  const sources = {}

  const ret = await dispatch({sources})(action)

  t.deepEqual(ret, {status: 'noaction'})
})

test('should return null when unknown action', async (t) => {
  const action = {type: 'UNKNOWN'}
  const sources = {}
  const actions = {}

  const ret = await dispatch({sources, actions})(action)

  t.deepEqual(ret, {status: 'noaction'})
})

test('should call action handler with payload and ident', async (t) => {
  const getHandler = sinon.stub().resolves({status: 'ok'})
  const actions = {'GET': getHandler}
  const ident = {id: 'ident1', roles: [], tokens: []}
  const payload = {}
  const action = {type: 'GET', payload, meta: {ident}}

  await dispatch({actions})(action)

  t.is(getHandler.callCount, 1)
  const arg = getHandler.args[0][0]
  t.is(arg.payload, payload)
  t.truthy(arg.ident)
  t.is(arg.ident.id, 'ident1')
})

test('should call action handler with sources, datatypes, and identOptions', async (t) => {
  const getHandler = sinon.stub().resolves({status: 'ok'})
  const actions = {'GET': getHandler}
  const sources = {}
  const datatypes = {}
  const identOptions = {}
  const action = {type: 'GET'}

  await dispatch({actions, sources, datatypes, identOptions})(action)

  t.is(getHandler.callCount, 1)
  const resources = getHandler.args[0][1]
  t.is(resources.sources, sources)
  t.is(resources.datatypes, datatypes)
  t.is(resources.identOptions, identOptions)
})

test('should call action handler with dispatch function', async (t) => {
  const action = {type: 'GET'}
  const getHandler = sinon.stub().resolves({status: 'ok'})
  const actions = {'GET': getHandler}

  const dispatchFn = dispatch({actions})
  await dispatchFn(action)

  t.is(getHandler.callCount, 1)
  const resources = getHandler.args[0][1]
  t.is(resources.dispatch, dispatchFn)
})

test('should call middlewares', async (t) => {
  const action = {type: 'TEST'}
  const actions = {'TEST': () => 'fromAction'}
  const middlewares = [
    (next) => async (action) => `<${await next(action)}>`,
    (next) => async (action) => `(${await next(action)})`
  ]
  const expected = '<(fromAction)>'

  const ret = await dispatch({actions, middlewares})(action)

  t.is(ret, expected)
})

test('should allow middlewares to abort middleware chain', async (t) => {
  const action = {type: 'TEST'}
  const actionHandler = sinon.stub().resolves({status: 'ok'})
  const actions = {'TEST': actionHandler}
  const middlewares = [
    (next) => async (action) => ({status: 'error'})
  ]

  const ret = await dispatch({actions, middlewares})(action)

  t.deepEqual(ret, {status: 'error'})
  t.is(actionHandler.callCount, 0)
})

test('should dispatch to middleware from action handlers', async (t) => {
  const action = {type: 'DISPATCHER'}
  const actions = {
    'TEST': () => 'fromAction',
    'DISPATCHER': (action, {dispatch}) => dispatch({type: 'TEST'})
  }
  const middlewares = [
    (next) => async (action) => `<${await next(action)}>`
  ]
  const expected = '<<fromAction>>'

  const ret = await dispatch({actions, middlewares})(action)

  t.is(ret, expected)
})
