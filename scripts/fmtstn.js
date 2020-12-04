// fmtstn(str) -> [str, str?]
// normalizes a station name
// e.g. UBC Exchange @ Bay 6 to ['UBC Exch', 'Bay 6']
window.fmtstn = function fmtstn (name) {
  const norm = window.normname
  const dirs = ['Westbound', 'Eastbound', 'Northbound', 'Southbound']
  const switchwords = ['Bay', 'Unload', 'Layover', 'Block']
  let [on, at] = name.split(' @ ')

  // replace e.g. Eastbound Central Blvd to Central Blvd E
  for (const dir of dirs) {
    if (on.startsWith(dir)) {
      on = on.slice(dir.length + 1) + ' ' + dir[0]
      break
    }
  }

  // normalize both names
  if (at) at = norm(at)
  if (on) on = norm(on)

  return at
    // switches direction if name starts or ends with one of the predefined keywords
    ? switchwords.find(w => at.startsWith(w) || at.endsWith(w))
        ? [on, at]
        : [at, on]
    // this station name didn't have an @ symbol
    : [on]
}
