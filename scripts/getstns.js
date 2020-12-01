window.getstns = async function getstns (path) {
  // dependencies
  const db = window.db
  const cache = JSON.parse(window.localStorage.stations || '[]')

  const stations = []
  const missing = []
  for (const id of path) {
    const station = cache.find(station => +station.id === id)
    if (station) {
      stations.push(station)
    } else {
      missing.push(id)
    }
  }
  if (missing.length) {
    const gets = []
    for (let i = 0; i < missing.length; i += 10) {
      const chunk = missing.slice(i, i + 10)
      const promise = db.collection('stations').where('id', 'in', chunk).get()
      console.log('queueing get for', chunk)
      gets.push(promise)
    }
    const cols = await Promise.all(gets)
    for (const col of cols) {
      for (const doc of col.docs) {
        const station = doc.data()
        console.log('got', station)
        cache.push(station)
        stations.push(station)
      }
    }
  }
  stations.sort((a, b) => path.indexOf(a.id) - path.indexOf(b.id))
  window.localStorage.stations = JSON.stringify(cache)
  return stations
}
