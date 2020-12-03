// getstns(stnids)
// get stations in id list from cache, or db if nonexistent
window.getstns = async function getstns (stnids) {
  // dependencies
  const db = window.db
  const cache = JSON.parse(window.localStorage.stations || '[]')

  // find all stations in the given path that aren't cached
  const stns = []
  const missing = []
  for (const id of stnids) {
    // determine if the station has been cached
    const station = cache.find(stn => +stn.id === id)
    if (station) {
      // this station will be a part of the resolved path
      stns.push(station)
    } else {
      // we are missing details on this station
      missing.push(id)
    }
  }

  // only enter query procedure if we are missing any routes
  if (missing.length) {
    const gets = []

    // firestore only supports matching arrays in chunks of 10
    for (let i = 0; i < missing.length; i += 10) {
      const chunk = missing.slice(i, i + 10)
      const promise = db.collection('stops').where('id', 'in', chunk).get()
      gets.push(promise)
    }

    // perform all gets concurrently
    const cols = await Promise.all(gets)

    // append all chunk contents to result and to cache
    for (const col of cols) {
      for (const doc of col.docs) {
        const station = doc.data()
        cache.push(station)
        stns.push(station)
      }
    }
  }

  // sort stations to match id sequence
  stns.sort((a, b) => stnids.indexOf(a.id) - stnids.indexOf(b.id))

  // update cache so we don't have to query db for this path anymore
  window.localStorage.stations = JSON.stringify(cache)

  // return result
  return stns
}
