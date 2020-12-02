// kwsplit(str) -> str[]
// splits a string into multiple keywords
// keywords have the following attributes:
// - are case insensitive
// - are space-separated
// - ignore empty strings
window.kwsplit = function kwsplit (string) {
  return string
    .toUpperCase()
    .split(' ')
    .filter(kw => kw)
}
