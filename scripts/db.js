// init firebase
window.firebase.initializeApp({
  apiKey: 'AIzaSyBYV23zeovHmzX26j9H9HYyI9kBlAzZcvg',
  authDomain: 'bus-dating.firebaseapp.com',
  databaseURL: 'https://bus-dating.firebaseio.com',
  projectId: 'bus-dating',
  storageBucket: 'bus-dating.appspot.com',
  messagingSenderId: '1012927739228',
  appId: '1:1012927739228:web:ce582ea70ee1c0f25b7d99'
})

// bus-dating
// apiKey: 'AIzaSyBYV23zeovHmzX26j9H9HYyI9kBlAzZcvg',
// authDomain: 'bus-dating.firebaseapp.com',
// databaseURL: 'https://bus-dating.firebaseio.com',
// projectId: 'bus-dating',
// storageBucket: 'bus-dating.appspot.com',
// messagingSenderId: '1012927739228',
// appId: '1:1012927739228:web:ce582ea70ee1c0f25b7d99'

// riderly
// apiKey: 'AIzaSyAm8r7J9OSOEU1RCMDDL3BNZo5h_jgtcXM',
// authDomain: 'riderly-1800.firebaseapp.com',
// databaseURL: 'https://riderly-1800.firebaseio.com',
// projectId: 'riderly-1800',
// storageBucket: 'riderly-1800.appspot.com',
// messagingSenderId: '1059537142713',
// appId: '1:1059537142713:web:eb92a5b337aa5f74d8ac68'

window.db = window.firebase.firestore()
