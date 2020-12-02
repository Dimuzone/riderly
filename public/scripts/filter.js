// filter(data: any[], query: str, limit: int) -> any
// gets a max of `limit` entries in `data` matching `query`
window.filter = function filter (data, keywords, limit) {
  const res = []
  if (!keywords.length) return res

  // search all items in given dataset
  for (const val of data) {
    // properties of identifier used:
    // - combines id and name
    // - strips out '_' and ' ' chars
    // - case-insensitive
    const id = ('' + val.id + val.name).replace(/_/g, ' ').toUpperCase()

    // statement following this one adds to result,
    // so continue if a match isn't found within the calculated identifier
    if (keywords.find(kw => !id.includes(kw))) continue

    // stop search if we satisfy the max number of items requested
    if (res.push(val) === limit) {
      break
    }
  }

  return res
}
