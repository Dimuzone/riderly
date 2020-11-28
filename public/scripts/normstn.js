const dirs = ['Westbound', 'Eastbound', 'Northbound', 'Southbound']

window.normstn = function normstn (name) {
  let [on, at] = name.split(' @ ')
  for (const dir of dirs) {
    if (on.startsWith(dir)) {
      on = on.slice(dir.length + 1) + ' ' + dir[0]
      break
    }
  }
  return at
    ? at.startsWith('Bay')
        ? [on, at]
        : [at, on]
    : [on]
}
