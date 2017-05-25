const integreat = require('./index')
const debug = require('debug')('great')

const lengthMap = (value) => (value) ? value.length : 0

const sourceDefs = [
  require('./examples/accountsSource'),
  require('./examples/couchdbSource')
]
const typeDefs = [
  require('./examples/accountType')
]
const adapters = {
  json: require('./lib/adapters/json'),
  couchdb: require('./lib/adapters/couchdb')
}
const mappers = {
  length: lengthMap
}
const filters = {}
const auths = {
  cloudant: require('./examples/cloudantAuth'),
  couchdb: require('./examples/couchdbAuth')
}

const great = integreat(sourceDefs, typeDefs, {
  adapters,
  mappers,
  filters,
  auths
})

debug('Integreat v' + great.version)

module.exports = great

// Load default mappers and filters
// great.loadDefaults()

// great.on('sync', (source, items) => {
//   console.log('Synced %d items for source `%s` at %s.', items.length, source.id, new Date())
// })

// Load source definitions from database
// great.loadSourceDefsFromDb()

// Start server
// .then(() => great.start())

// Server is running
// .then((server) => {
//   if (server) {
//     console.log('Integreat is running on port %d.', server.address().port)
//   } else {
//     console.log('Integreat is running without a http server')
//   }
// })
