const path = require('path')
const glob = require('glob')
const { resolve } = require('path')
const { defineConfig } = require('vite')

const input = glob.sync('./*.html').reduce((acc, file_path) => {
  const {name, base} = path.parse(file_path);

  // just in case
  if (acc[name]) throw new Error(`duplicated html file detected: ${file_path} and ${acc[name]}`)

  return {...acc, [name]: resolve(__dirname, base)}
}, {});

module.exports = defineConfig({
  build: {
    rollupOptions: {
      input
    }
  }
})