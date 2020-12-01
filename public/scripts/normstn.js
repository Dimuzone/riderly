window.normstn = function normstn (str) {
  if (str === 'U B C') return 'UBC'
  return str.split(' ')
    .map(word => {
      switch (word) {
        case 'Westminster': return 'West'
        case 'Station': return 'Stn'
        case 'Central': return 'Ctrl'
        case 'Exchange': return 'Exch'
        case 'Parkway': return 'Pkwy'
        default: return word
      }
    })
    .join(' ')
}
