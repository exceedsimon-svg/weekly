const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

for (const name of ['api', 'vite']) {
  const pidPath = path.join(root, `local-${name}.pid`)
  if (!fs.existsSync(pidPath)) continue

  const pid = Number(fs.readFileSync(pidPath, 'utf8').trim())
  if (Number.isInteger(pid) && pid > 0) {
    try {
      process.kill(pid, 'SIGTERM')
      console.log(`stopped ${name} pid ${pid}`)
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
}
