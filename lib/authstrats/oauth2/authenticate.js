const got = require('got')
const debug = require('debug')('great:auth')

async function authenticate ({uri, key, secret}) {
  const credentials = `${encodeURIComponent(key)}:${encodeURIComponent(secret)}`
  const credentials64 = Buffer.from(credentials).toString('base64')

  try {
    return await got(uri, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Authorization': `Basic ${credentials64}`
      }
    })
  } catch (error) {
    debug(`Oauth2: Server returned an error. ${error}`)
    return false
  }
}

module.exports = authenticate
