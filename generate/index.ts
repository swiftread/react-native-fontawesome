const path = require('path') as typeof import('path')
const fs = require('fs') as typeof import('fs')
import { transform } from '@svgr/core'

const iconFileDirectory = path.resolve(__dirname, './fontawesome/svgs')

const getSvgFiles = (dir: string): string[] => {
  const dirents = fs.readdirSync(dir, { withFileTypes: true })
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name)
    return dirent.isDirectory() ? getSvgFiles(res) : res
  })

  return Array.prototype
    .concat(...files)
    .filter((file) => path.extname(file) === '.svg')
}

const iconFileNames = getSvgFiles(iconFileDirectory)

const getIconSvg = async (filepath: string) => {
  return new Promise<string>((resolve) =>
    fs.readFile(filepath, 'utf8', (_, svg) => resolve(svg))
  )
}

const srcDirectory = path.resolve(__dirname, '../src')

const run = async () => {
  await Promise.all(
    iconFileNames.map(async (filepath) => {
      const svg = await getIconSvg(filepath)
      const relativePath = path.relative(iconFileDirectory, filepath)
      const componentName = getComponentName(relativePath)

      const transformed = await transform(
        svg,
        {
          native: true,
          ref: false,
          expandProps: 'end',
          typescript: true,
          svgProps: {},
        },
        {
          componentName,
        }
      )

      const outPath = path.resolve(
        srcDirectory,
        `${getSnakeCaseFilename(relativePath)}.tsx`
      )

      await new Promise((resolve) => {
        fs.writeFile(outPath, heading + '\n' + transformed, resolve)
      })
    })
  )

  const generateIndexFile = () => {
    const contents = iconFileNames
      .map((filepath) => {
        const relative = getSnakeCaseFilename(
          path.relative(iconFileDirectory, filepath)
        )
        return `export { default as ${getComponentName(
          filepath
        )} } from './${relative}'`
      })
      .join('\n')
    fs.writeFileSync(
      path.resolve(srcDirectory, 'index.ts'),
      heading + '\n' + contents
    )
  }

  generateIndexFile()
}

const heading = `// 🌊 this file is auto-generated. don't edit it.`

run()

const getComponentName = (filepath: string) => {
  const relativeParts = path
    .relative(iconFileDirectory, filepath)
    .split('.')[0]
    .split(path.sep)

  return relativeParts
    .map((part) =>
      part
        .split(/[-_]/) // Split by hyphens and underscores
        .map(
          (subPart) =>
            subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase()
        )
        .join('')
    )
    .join('')
}

const getSnakeCaseFilename = (filepath: string) => {
  return filepath.split('.')[0].split(path.sep).join('-').toLowerCase()
}
