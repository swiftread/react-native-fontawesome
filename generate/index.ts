const path = require('path') as typeof import('path')
const fs = require('fs') as typeof import('fs')
import { transform } from '@svgr/core'

const rootSrcDirectory = path.resolve(__dirname, '../src')

const run = async (name: 'brands' | 'regular' | 'solid') => {
  const iconFileDirectory = path.resolve(__dirname, 'fontawesome', 'svgs', name)

  console.log('iconFileDirectory', iconFileDirectory)

  const srcDirectory = path.resolve(rootSrcDirectory, name)

  const iconFileNames = fs
    .readdirSync(iconFileDirectory)
    .filter((file) => file.endsWith('.svg'))

  console.log('icon file names', iconFileNames.slice(0, 5))

  const getIconSvg = async (filename: string) => {
    return new Promise<string>((resolve) =>
      fs.readFile(path.resolve(iconFileDirectory, filename), 'utf8', (_, svg) =>
        resolve(svg)
      )
    )
  }

  fs.mkdirSync(srcDirectory, { recursive: true })

  await Promise.all(
    iconFileNames.map(async (filename) => {
      const svg = await getIconSvg(filename)

      const componentName = getComponentName(filename)

      if (!svg) {
        throw new Error(`missing svg for ${name}/${filename}`)
      }

      const size = '24'

      const transformed = await transform(
        svg,
        {
          native: true,
          ref: false,
          expandProps: 'end',
          typescript: true,
          svgProps: {
            width: size,
            height: size,
          },
        },
        {
          componentName,
        }
      )

      const outDirectory = srcDirectory
      const outPath = path.resolve(outDirectory, filename.replace('svg', 'tsx'))

      await new Promise((resolve) => {
        fs.writeFile(outPath, heading + '\n' + transformed, resolve)
      })
    })
  )

  const generateIndexFile = () => {
    const contents = iconFileNames
      .map(
        (filename) =>
          `export { default as ${getComponentName(filename)} } from './${
            filename.split('.')[0]
          }'`
      )
      .join('\n')
    const filePath = path.resolve(srcDirectory, 'index.tsx')
    fs.writeFileSync(filePath, heading + '\n' + contents)
  }

  generateIndexFile()
}

const heading = `// 🌊 this file is auto-generated. don't edit it.`

run('brands')
run('regular')
run('solid')

const generateBarrelFile = () => {
  const contents = `
export * as FaBrands from './brands'
export * as FaRegular from './regular'
export * as FaSolid from './solid'
  `.trim()
  const filePath = path.resolve(rootSrcDirectory, 'index.tsx')
  fs.writeFileSync(filePath, heading + '\n' + contents)
}

generateBarrelFile()

// pascal case
const getComponentName = (filename: string) => {
  let name = filename
    .split('.')[0]
    .toLowerCase()
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      (_, $2, $3) => `${$2.toUpperCase() + $3}`
    )
    .replace(new RegExp(/\w/), (s) => s.toUpperCase())

  // prefix component name with "Fa"
  name = 'Fa' + name

  return name
}
