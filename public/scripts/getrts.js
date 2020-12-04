// getrts()
// get routes from cache, or db if nonexistent
window.getrts = async function getrts () {
  // dependencies
  const db = window.db
  const normname = window.normname
  const routes = JSON.parse(window.localStorage.routes || '[]')

  // if cache is empty
  if (!routes.length) {
    // get all routes from firestore
    const col = await db.collection('routes').get()

    // normalize collection contents
    for (const doc of col.docs) {
      const docdata = doc.data()
      routes.push({ ...docdata, id: doc.id, name: normname(docdata.name) })
    }

    // add routes to cache
    window.localStorage.routes = JSON.stringify(routes)
  }

  return routes
}
