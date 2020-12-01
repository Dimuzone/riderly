window.fmtstn = function fmtstn (name) {
  const norm = window.normstn
  const dirs = ['Westbound', 'Eastbound', 'Northbound', 'Southbound']
  const switchwords = ['Bay', 'Unload', 'Layover', 'Block']
  let [on, at] = name.split(' @ ')
  for (const dir of dirs) {
    if (on.startsWith(dir)) {
      on = on.slice(dir.length + 1) + ' ' + dir[0]
      break
    }
  }
  if (at) at = norm(at)
  if (on) on = norm(on)
  return at
    ? switchwords.find(w => at.startsWith(w) || at.endsWith(w))
        ? [on, at]
        : [at, on]
    : [on]
}
