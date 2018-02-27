require('dotenv').config()
const Redis = require('ioredis')

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
    await r.set(guild, JSON.stringify({ settings: guildData, disabledModules }))
  }
  process.exit()
})
