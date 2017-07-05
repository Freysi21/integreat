import test from 'ava'
import sinon from 'sinon'

import router from './router'

// Tests -- actions

test('should exist', (t) => {
  t.is(typeof router, 'function')
})

test('should return status noaction when no action', async (t) => {
  const action = null
  const sources = {}

  const ret = await router(action, {sources})

  t.deepEqual(ret, {status: 'noaction'})
})

test('should return null when unknown action', async (t) => {
  const action = {type: 'UNKNOWN', source: 'entries'}
  const sources = {}
  const actions = {}

  const ret = await router(action, {sources, actions})

  t.deepEqual(ret, {status: 'noaction'})
})

test('should route to GET action', async (t) => {
  const items = [{id: 'ent1', type: 'entry'}]
  const action = {
    type: 'GET',
    source: 'entries',
    payload: {id: 'ent1', type: 'entry'}
  }
  const actions = {
    'GET': async () => ({status: 'ok', data: items})
  }

  const ret = await router(action, {actions})

  t.is(ret.status, 'ok')
  t.deepEqual(ret.data, items)
})

test('should call action handler with sources, types, workers, and dispatch', async (t) => {
  const action = {
    type: 'GET'
  }
  const getHandler = sinon.stub().returns(Promise.resolve({status: 'ok'}))
  const actions = {'GET': getHandler}
  const sources = {}
  const types = {}
  const workers = {}
  const dispatch = () => {}

  await router(action, {actions, sources, types, workers, dispatch})

  t.true(getHandler.calledOnce)
  const resources = getHandler.args[0][1]
  t.is(resources.sources, sources)
  t.is(resources.types, types)
  t.is(resources.workers, workers)
  t.is(resources.dispatch, dispatch)
})

// Tests -- queue

test('should add action to queue', async (t) => {
  const action = {
    type: 'SET',
    source: 'store',
    payload: {},
    queue: true
  }
  const queue = sinon.stub().returns(Promise.resolve(true))
  const actions = {
    'SET': async () => ({status: 'ok'})
  }

  const ret = await router(action, {queue, actions})

  t.deepEqual(ret, {status: 'queued'})
  t.true(queue.calledOnce)
  const pushed = queue.args[0][0]
  t.truthy(pushed)
  t.is(pushed.type, 'SET')
  t.is(pushed.source, 'store')
  t.deepEqual(pushed.payload, {})
  t.false(pushed.queue)
  const timestamp = queue.args[0][1]
  t.is(timestamp, null)
})

test('should schedule action', async (t) => {
  const action = {
    type: 'SET',
    source: 'store',
    payload: {},
    queue: new Date('2017-09-01T09:00:00Z')
  }
  const queue = sinon.stub().returns(Promise.resolve(true))
  const actions = {
    'SET': async () => ({status: 'ok'})
  }

  const ret = await router(action, {queue, actions})

  t.deepEqual(ret, {status: 'queued'})
  t.true(queue.calledOnce)
  const pushed = queue.args[0][0]
  t.false(pushed.queue)
  const timestamp = queue.args[0][1]
  t.is(new Date(timestamp).getTime(), 1504256400000)
})

test('should return error when queueing fails', async (t) => {
  const action = {
    type: 'SET',
    source: 'store',
    payload: {},
    queue: true
  }
  const queue = sinon.stub().returns(Promise.resolve(false))
  const actions = {
    'SET': async () => ({status: 'ok'})
  }

  const ret = await router(action, {queue, actions})

  t.deepEqual(ret, {status: 'error'})
})