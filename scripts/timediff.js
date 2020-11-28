window.timediff = function timediff (then, now) {
  const s = 1000
  const m = s * 60
  const h = m * 60
  const d = h * 24
  const delta = now - then
  if (delta > d) {
    return Math.floor(delta / d) + 'd'
  } else if (delta > h) {
    return Math.floor(delta / h) + 'h'
  } else if (delta > m) {
    return Math.floor(delta / m) + 'm'
  } else if (delta > s) {
    return Math.floor(delta / s) + 's'
  } else {
    return delta + 'ms'
  }
}
