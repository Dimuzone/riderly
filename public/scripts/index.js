const {
  firebase, db, timediff, fmtstn, normname, patch, getstns,
  main, header, section, div, h1, h2, button, span, strong, a
} = window

const $main = document.querySelector('main')

const state = {
  user: JSON.parse(window.sessionStorage.user || null),
  search: JSON.parse(window.sessionStorage.search || null),
  stations: JSON.parse(window.localStorage.stations || '[]'),
  recents: JSON.parse(window.localStorage.recents || '[]')
    .map(id => {
      const [route, station] = id.split('/')
      return { route, station: +station }
    }),
  tab: 'recents',
  saves: [],
  messages: []
}

const switchtab = (state, newtab) =>
  ({ ...state, tab: newtab })

;(async function main () {
  if (state.recents.length) {
    const stnids = state.recents.map(save => save.station)
    state.stations.push(...await getstns(stnids))
    window.localStorage.stations = JSON.stringify(state.stations)
    for (const recent of state.recents) {
      recent.station = state.stations.find(station => station.id === recent.station)
    }
  }

  if (state.search) {
    delete window.sessionStorage.search
  }

  render(state)

  // get chat messages and rerender
  const col = await db.collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(3).get()
  for (const doc of col.docs) {
    state.messages.push(doc.data())
  }
})()

firebase.auth().onAuthStateChanged(async user => {
  // if user isn't logged in, we don't need to do anything extra.
  // just render and exit
  if (!user) return render(state)

  // save user data
  const doc = await db.collection('users').doc(user.uid).get()
  const userdata = doc.data()
  state.user = userdata
  state.saves = userdata.saves
  render(state)
})

function render (state) {
  const { user, tab, recents, saves, messages } = state
  const name = user ? user.name.split(' ')[0] : ''

  // login/logout button
  const onlogin = async _ => {
    if (!user) {
      window.location.href = 'login.html'
    } else {
      await firebase.auth().signOut()
      delete window.sessionStorage.user
      window.location.href = 'index.html'
    }
  }

  patch($main, main({ class: 'page -home' }, [
    header({ class: 'header -search -home' }, [
      div({ class: 'title-row' }, [
        h1({ class: 'title' }, 'Home'),
        button({ class: 'button -login', onclick: onlogin },
          !user ? 'Login' : 'Logout')
      ]),
      a({ href: './search.html', class: 'search' }, [
        div({ class: 'search-bar' }, [
          span({ class: 'icon -search material-icons' },
            'search'),
          span({ class: 'search-input' }, 'Search routes')
        ])
      ])
    ]),
    div({ class: 'page-content' }, [
      user
        ? span({ class: 'greeting' },
            ['Hi, ', strong(name), '!'])
        : '',
      section({ class: 'section -stations' }, [
        h2({ class: 'section-title section-header' },
          tab === 'recents' ? 'Recent Stations' : 'Saved Stations'),
        div({ class: 'section-tabs' }, [
          button({
            class: 'section-tab' + (tab === 'recents' ? ' -select' : ''),
            onclick: _ => render(switchtab(state, 'recents'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'recents' ? 'watch_later' : 'access_time'),
            'History'
          ]),
          button({
            class: 'section-tab' + (tab === 'saves' ? ' -select' : ''),
            onclick: _ => render(switchtab(state, 'saves'))
          }, [
            span({ class: 'icon -tab material-icons' },
              tab === 'saves' ? 'star' : 'star_outline'),
            'Saved'
          ])
        ]),
        tab === 'recents'
          ? recents.length
              ? div({ class: 'section-content stations -recent' }, recents.map(Save))
              : span({ class: 'section-content section-notice' },
                'When you view a station, it will appear here.')
          : saves.length
            ? div({ class: 'section-content stations -saves' })
            : span({ class: 'section-content section-notice' },
              'When you save a station, it will appear here.')
      ]),
      section({ class: 'section -messages' }, [
        h2({ class: 'section-title section-header' }, 'Recent Messages'),
        messages.length
          ? div({ class: 'section-content messages' }, messages.map(Message))
          : span({ class: 'section-content section-notice' },
            'No recent user activity!')
      ])
    ])
  ]))
}

function Save (save) {
  const { station, route } = save
  const [name, subname] = fmtstn(station.name)
  const addendum = subname ? [' · ', strong(subname)] : []
  return a({ class: 'option', href: `station.html#${route}/${station.id}` }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -route material-icons-outlined' },
        'place'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `${name} (${route})`),
        div({ class: 'option-data' },
          [station.id, ...addendum])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'icon -option material-icons' }, 'chevron_right')
    ])
  ])
}

const Message = (message) => {
  const { timestamp, route: routeid, username, content } = message
  const now = Date.now()
  const ago = timediff(timestamp, now)
  return a({ class: 'option -message', href: 'chat.html#' + routeid }, [
    div({ class: 'option-lhs' }, [
      span({ class: 'icon -message material-icons-outlined' },
        'sms'),
      div({ class: 'option-meta' }, [
        div({ class: 'option-name' }, `"${content}"`),
        div({ class: 'option-data' },
          ['from ', strong(username), ' on ', strong(routeid)])
      ])
    ]),
    div({ class: 'option-rhs' }, [
      span({ class: 'option-time' }, ago),
      span({ class: 'icon -arrow material-icons' },
        'keyboard_arrow_right')
    ])
  ])
}
