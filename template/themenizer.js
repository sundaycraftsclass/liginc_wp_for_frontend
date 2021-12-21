const path = require('path')
const fsSync = require('fs')
const fs = require('fs/promises')
const glob = require('glob')

const pkg = JSON.parse(fsSync.readFileSync('package.json').toString())

const dist_dir = 'dist'
const wp_theme_dir = `${pkg.name}`

async function mkdir (dir) {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, {recursive: true})
  }
}

async function mvFile(from, to) {
  const stat = await fs.stat(from)
  if (stat.isDirectory()) return

  const {dir} = path.parse(to);
  await mkdir(dir)
  await fs.copyFile(from, to)
  await fs.rm(from)
}

async function mv_html_php(file_path) {
  const {dir, name, ext} = path.parse(file_path);
  if (ext !== '.html' || ext === '.php') return file_path

  const php_path = path.resolve(dir, `${name}.php`);
  await mvFile(file_path, php_path)

  return php_path
}

async function create_theme_stylecss () {
  const theme_comment = `/*!
Theme Name: ${pkg.name}
Theme URI: ${pkg.homepage}
Author: ${pkg.author.name}
Author URI: ${pkg.author.url}
Description: ${pkg.description}
Version: ${pkg.version}
Tested up to: ${pkg.engines.php}
Requires PHP: ${pkg.engines.php}
License: ${pkg.license}
License URI: -
Text Domain: ${pkg.name}
Tags:
*/
`

  await fs.writeFile(`${wp_theme_dir}/style.css`, theme_comment)
}

async function themenize() {
  const files = await new Promise((resolve, reject) => glob(`${dist_dir}/**/*`, (err, files) => {
    if (err) {
      reject(err)
    } else {
      resolve(files)
    }
  }));

  await mkdir(wp_theme_dir)

  const new_files = await Promise.all(files.map(mv_html_php));

  new_files.map(async file_path => {
    const {base} = path.parse(file_path);
    await mvFile(file_path, path.resolve(wp_theme_dir, base))
  })

  await create_theme_stylecss()
}

async function main() {
  try {
    await fs.access(dist_dir)
  } catch {
    throw new Error(`cannot access to the dist directory: ${dist_dir}`)
  }

  await themenize()
  await fs.rmdir(dist_dir, { recursive: true, force: true})
}

main()
