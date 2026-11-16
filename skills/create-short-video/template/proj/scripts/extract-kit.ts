// bun run extract-kit <saved Style Atlas prompt.md>
// Pulls the Futurepedia H helper library and SOUND kit (the first two ```js blocks of any Style Atlas
// prompt) into src/lib/harness.js and src/lib/sound.js. They belong to Futurepedia, so they are never
// committed (see .gitignore). The style kit itself (src/style/<style>.js) is a port you write from the
// prompt's reference code — see the create-video skill, "Switching Atlas style".
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const prompt = process.argv[2]
if (!prompt) throw new Error("Usage: bun run extract-kit prompts/<style>.md")
const md = readFileSync(prompt, "utf8")
const blocks = [...md.matchAll(/```js\n([\s\S]*?)\n```/g)].map((m) => m[1]!)
if (blocks.length < 2) throw new Error("Expected the H library and the SOUND kit as the first two ```js blocks")
const root = join(import.meta.dir, "..")
mkdirSync(join(root, "src/lib"), { recursive: true })
writeFileSync(join(root, "src/lib/harness.js"), blocks[0] + "\n")
writeFileSync(join(root, "src/lib/sound.js"), blocks[1] + "\n")
console.log("wrote src/lib/harness.js and src/lib/sound.js; now port the style into src/style/")
