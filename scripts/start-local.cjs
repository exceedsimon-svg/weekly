const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const root = path.resolve(__dirname, '..')
const apiDir = path.join(root, 'api')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function start(name, cwd, args) {
  const logPath = path.join(root, `local-${name}.log`)
  const out = fs.openSync(logPath, 'a')
  const child = spawn(npm, args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, npm_config_cache: path.join(root, '..', '.npm-cache') }
  })

  fs.writeFileSync(path.join(root, `local-${name}.pid`), `${child.pid}\n`)
  child.unref()
  fs.closeSync(out)
  console.log(`${name} pid ${child.pid}`)
}

start('api', apiDir, ['start'])
start('vite', root, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'])
