const fs = require('fs')
const path = require('path')

const SVG_DIRECTORY = path.resolve(__dirname, 'fontawesome/svgs')

// This regex pattern captures the entire SVG comment as described.
const COMMENT_REGEX =
  /<!--! Font Awesome Free .*? Copyright \d{4} Fonticons, Inc\. -->/g

const processSvgFile = (filePath: string) => {
  const content = fs.readFileSync(filePath, 'utf8')
  const newContent = content.replace(COMMENT_REGEX, '')

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    console.log(`Processed: ${filePath}`)
  }
}

const processDirectory = (dir: string) => {
  const dirents = fs.readdirSync(dir, { withFileTypes: true })

  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      processDirectory(path.resolve(dir, dirent.name))
    } else if (dirent.isFile() && path.extname(dirent.name) === '.svg') {
      processSvgFile(path.resolve(dir, dirent.name))
    }
  }
}

processDirectory(SVG_DIRECTORY)
console.log('Finished processing SVG files.')
