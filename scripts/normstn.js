window.normstn = function normstn (name) {
  let [on, at] = name.split(' @ ')
  if (on.startsWith('Westbound')) {
    on = on.slice('Westbound'.length + 1) + ' W'
  } else if (on.startsWith('Eastbound')) {
    on = on.slice('Eastbound'.length + 1) + ' E'
  }
  return at
    ? at.startsWith('Bay')
        ? [on, at]
        : [at, on]
    : [on]
}
