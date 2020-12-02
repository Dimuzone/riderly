window.getrts = async function getrts () {
  // dependencies
  const db = window.db
  const routes = JSON.parse(window.localStorage.routes || '[]')
  if (!routes.length) {
    // Get all routes from Firestore
    const col = await db.collection('routes').get()
    for (const doc of col.docs) {
      routes.push({ ...doc.data(), id: doc.id })
    }
    window.localStorage.routes = JSON.stringify(routes)
  }
  return routes
}
