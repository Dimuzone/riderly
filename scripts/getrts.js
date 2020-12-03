// getrts()
// get routes from cache, or db if nonexistent
window.getrts = async function getrts () {
  // dependencies
  const db = window.db
  const routes = JSON.parse(window.localStorage.routes || '[]')

  // if cache is empty
  if (!routes.length) {
    // get all routes from firestore
    const col = await db.collection('routes').get()

    // normalize collection contents
    for (const doc of col.docs) {
      routes.push({ ...doc.data(), id: doc.id })
    }

    // add routes to cache
    window.localStorage.routes = JSON.stringify(routes)
  }

  return routes
}
