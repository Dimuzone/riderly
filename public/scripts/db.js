// init firebase
window.firebase.initializeApp({
  apiKey: 'AIzaSyAm8r7J9OSOEU1RCMDDL3BNZo5h_jgtcXM',
  authDomain: 'riderly-1800.firebaseapp.com',
  databaseURL: 'https://riderly-1800.firebaseio.com',
  projectId: 'riderly-1800',
  storageBucket: 'riderly-1800.appspot.com',
  messagingSenderId: '1059537142713',
  appId: '1:1059537142713:web:eb92a5b337aa5f74d8ac68'
})

window.db = window.firebase.firestore()
