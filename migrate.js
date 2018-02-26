require('dotenv').config()
const Redis = require('ioredis')
const http = require('http')
let Gun

try {
  Gun = require('gun')
} catch (e) {
  console.error("Can't find the \"gun\" module. Please run \"npm install gun@^0.7.9\" before running this script")
}

// Create a Gun instance
const gun = new Gun({
  web: http.createServer(),
  file: 'data.db'
})

// Connect to the Redis DB
const r = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1/1', {
  stringNumbers: true,
  enableOfflineQueue: false
})

r.once('ready', async () => {
  // Migrate guild data
  console.log('Migrating guild data...')
  const guilds = await r.keys('Guild:*')
  console.log(`${guilds.length} guilds found!`)
  for (let i = 0; i < guilds.length; i++) {
    const guild = guilds[i]
    console.log(`  Migrating guild ${i+1}/${guilds.length}`)
    const guildData = JSON.parse(await r.get(guild))
    const disabledModules = { }
    // Image Modules
    if (!guildData.allowImages) {
      Object.assign(disabledModules, {
        danbooru: true,
        image: true,
        seal: true
      })
    }
    delete guildData.allowImages
    // Other modules
    if (!guildData.allowTags) disabledModules.tags = true
    delete guildData.allowTags
    if (!guildData.allowRNG) disabledModules.rng = true
    delete guildData.allowRNG
    delete guildData.queueLoop
    delete guildData.restricted
    // Dynamic Nick
    if (guildData.dynamicNick) disabledModules.dynamicNick = false
    delete guildData.dynamicNick
    // Store the new data
    gun.get(guild).put({ val: JSON.stringify({ settings: guildData, disabledModules }) })
  }
  // Migrate waifus
  console.log('Migrating waifus...')
  const waifus = await r.keys('UserWaifu:*')
  console.log(`${waifus.length} waifus found!`)
  for (let i = 0; i < waifus.length; i++) {
    const waifu = waifus[i]
    console.log(`  Migrating waifu ${i+1}/${waifus.length}`)
    gun.get(waifu).put({ val: await r.get(waifu) })
  }
  // Migrate tags
  console.log('Migrating tags...')
  const tags = await r.keys('Tag:*')
  console.log(`${tags.length} tags found!`)
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    console.log(`  Migrating tag ${i+1}/${tags.length}`)
    gun.get(tag).put({ val: await r.get(tag) })
  }
  // Migrate raffle stats
  console.log('Migrating raffle stats...')
  const stats = await r.keys('RaffleStats:*')
  console.log(`${stats.length} found!`)
  for (let i = 0; i < stats.length; i++) {
    const u = stats[i]
    console.log(`  Migrating stats for user ${i+1}/${stats.length}`)
    gun.get(u).put({ val: await r.get(u) })
  }
  // Migrate blacklist
  console.log('Migrating blacklist...')
  gun.get('Blacklist').put({ val: await r.get('Blacklist') })
  process.exit()
})
