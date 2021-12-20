const Yaml = require('yaml')
const chokidar = require('chokidar')
const glob = require('glob')
const Handlebars = require('handlebars')
const fs = require('fs/promises')
const {rmSync} = require('fs')
const path = require('path')

const helpers = require('./helpers')

const src_dir = 'src';
const dist_dir = '../template';
const data_dir = 'data'
const partial_hbs_prefix = '_'
const HTML = '.html';
const HBS = '.hbs';
const YAML = '.yml'

const handlebars = Handlebars.create()
handlebars.registerHelper("times", helpers.times)

async function build_template(file_path) {
  console.log(`building file ${file_path} ...`)
  if (is_partial(file_path)) {
    await register_partial(file_path)
    await build_all()
    return
  }

  const dist_file_path = change_ext(flip_dist_src(file_path, true), HTML);

  const source = await fs.readFile(file_path);

  let template = handlebars.compile(source.toString());

  const dist_dir = path.parse(dist_file_path).dir
  try {
    await fs.access(dist_dir)
  } catch {
    await fs.mkdir(dist_dir, {recursive: true})
  }

  const data = await get_data(file_path);

  let template_data
  try {
    template_data = template(data);
  } catch (err) {
    console.error(err.toString())
    return
  }

  await fs.writeFile(dist_file_path, template_data);

  console.log(`success to build ${file_path} into ${dist_file_path}`)
}

async function get_data(template_path) {
  const {dir, name} = path.parse(template_path.replace(src_dir, data_dir));
  const yaml_path = `${dir}/${name}${YAML}`;

  try {
    await fs.access(yaml_path)
  } catch {
    return {}
  }

  const buffer = await fs.readFile(yaml_path);
  return Yaml.parse(buffer.toString())
}

function on_ready() {
  console.log('ready to watch files')
  console.log('cleaning up dist dir...')

  const files = glob.sync(`${dist_dir}/**/*${HTML}`);
  files.forEach(f => rmSync(f))

  return build_all
}

async function build_all() {
  return new Promise((resolve, reject) =>
    glob(`./${src_dir}/**/*${HBS}`, undefined, async (err, files) => {
      if (err) reject(err)

      await Promise.all(files
        .filter(is_partial)
        .map(register_partial))

      await Promise.all(files
        .filter(f => !is_partial(f))
        .map(build_template))

      resolve()
    }))
}

function is_partial(f) {
  return path.parse(f).name[0] === partial_hbs_prefix
}

async function register_partial(file_path) {
  console.log(`registering partial for ${file_path}...`)
  const {name} = path.parse(file_path);
  const name_without_prefix = name.slice(partial_hbs_prefix.length, name.length)
  const buffer = await fs.readFile(file_path);

  try {
    handlebars.registerPartial(name_without_prefix, buffer.toString())
  } catch (err) {
    console.error(err.toString())
  }
}

function flip_dist_src(file_path, into_dist) {
  const from = into_dist ? src_dir : dist_dir
  const to = into_dist ? dist_dir : src_dir

  const regExp = new RegExp(`(\.+\/)?${from}\/(.+)`, 'g')
  return file_path.replace(regExp, `${to}/$2`);
}

function change_ext(file_path, to) {
  if (to[0] !== '.') throw new Error('ext should start with dot .')

  const {dir, name} = path.parse(file_path);
  return `${dir}/${name}${to}`
}

async function delete_dist_file(file_path) {
  console.log(`deleted file ${file_path}`)

  let dist_path = change_ext(flip_dist_src(file_path, true), HTML);

  try {
    await fs.rm(dist_path)
    console.log(`deleted file ${dist_path}`)
  } catch {
    console.log(`tried to delete ${dist_path} but it has already been deleted`)
  }
}

function main() {
  chokidar.watch('./src')
    .on('ready', on_ready())
    .on('change', build_template)
    .on('unlink', delete_dist_file)
    .on('add', path => console.log(`add a new file on ${path}`))
}

main()
