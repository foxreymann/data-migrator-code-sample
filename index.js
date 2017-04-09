const config = require('./config')
const bluebird = require('bluebird')
const exec = bluebird.promisify(require('child_process').exec)
const my = require('knex')(config.devDb)
const ss = require('knex')(config.imDb)
const mapping = require('./mapping')
const cheerio = require('cheerio')
const getYoutubeId = require('get-youtube-id')
const GopherClient = require('./gopher_client')
const gopherClient = new GopherClient(config.gopher)

async function migrate() {

  let error = await exec('cat sql_videos/*.sql | ' + config.devDbCli)
  if (error) {
    return console.error(`mysql error: ${error}`);
  }

  let articles = await ss('Articles')
    .join('ArticleContentLinks', 'ArticleContentLinks.ArticleId', 'Articles.UAN')
    .join('Content', 'Content.ContentId', 'ArticleContentLinks.ContentId')
    .whereNot('Title','')
    .whereRaw('UAN = ParentArticleId')
    .whereIn('TemplateId', mapping.videoTemplates)
    .whereIn('FragmentFieldId', mapping.videoFields)

  await gopherClient.login()
  await Promise.all(articles.map(video))

  console.log('migration completed')
  my.destroy()
  ss.destroy()
}

async function video(article) {
  let $ = cheerio.load(article.Data)

  let sourceVideo = {
    url: $('video').attr('url'),
    type: $('video').attr('type')
  }

  if('brightcove' === sourceVideo.type) {
    let gopherId = await gopherClient.findByBrightcoveId(sourceVideo.url)
      if(gopherId) {
      let video = {
        type: 'Gopher',
        id: gopherId
      }
      return await insertVideo(article, video)
    }
  }

  let youtubeId = getYoutubeId(sourceVideo.url)
  if(youtubeId) {
    let video = {
      type: 'Youtube',
      id: youtubeId
    }
    return await insertVideo(article, video)
  }

  return 'no video for the article'
}

async function insertVideo(article, video) {
  return await my('exp_channel_data')
    .where('entry_id', article.UAN)
    .update({'field_id_7': video.id, 'field_id_120': video.type})
}

migrate()
