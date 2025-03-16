const a = await import('../lib/index.js')
const fs = await import('node:fs/promises')

const java = await import('./test-java.js')
const bedrock = await import('./test-bedrock.js')

if (!(await fs.stat('./out').catch(() => false))) {
  await fs.mkdir('./out')
}

await java.TestJava()
await bedrock.TestBedrock()
