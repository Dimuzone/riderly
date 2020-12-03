// normname(str)
// normalizes the name of a route or station
// TODO: perform this procedure before uploading stops/routes to db
window.normname = function normname (str) {
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
