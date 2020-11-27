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

window.db = window.firebase.firestore()
