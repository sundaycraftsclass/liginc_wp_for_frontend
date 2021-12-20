function times(time, options) {
  return [...Array(time)].reduce((str, _) => str + options.fn(this), "")
}

module.exports = {
  times
}
