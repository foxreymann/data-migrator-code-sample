const superagent = require('superagent')
const agent = superagent.agent()
const cheerio = require('cheerio')
const urljoin = require('url-join')
const sprintf = require('sprintf-js').sprintf

function GopherClient(config) {
  this.config = config
  this.config.password = process.env.GOPHER_PASSWORD
}

GopherClient.prototype.login = async function() {
  const payload = {
    utf8: '✓',
    email: this.config.username,
    password: this.config.password,
    commit: 'Sign in'
  }
  payload.authenticity_token = await this.getAuthToken()

  let res = await agent
    .post(urljoin(this.config.cmsUrl, this.config.loginPath))
    .type('form')
    .send(payload)

}

GopherClient.prototype.findByBrightcoveId = async function(id) {
  const res = await agent.get(urljoin(this.config.cmsUrl, sprintf(this.config.brightcovePath, id)))
  const resParsed = JSON.parse(res.text)
  try {
    return JSON.parse(res.text).videos[0].id
  } catch (e) {
    return false
  }
}

GopherClient.prototype.getAuthToken = async function() {
  const res = await agent.get(urljoin(this.config.cmsUrl, this.config.loginPath))
  const $ = cheerio.load(res.text)
  return $('[name=authenticity_token]').attr('value')
}

module.exports = GopherClient
