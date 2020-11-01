// firebase config
let fbconfig = {
	apiKey: "AIzaSyBYV23zeovHmzX26j9H9HYyI9kBlAzZcvg",
	authDomain: "bus-dating.firebaseapp.com",
	databaseURL: "https://bus-dating.firebaseio.com",
	projectId: "bus-dating",
	storageBucket: "bus-dating.appspot.com",
	messagingSenderId: "1012927739228",
	appId: "1:1012927739228:web:ce582ea70ee1c0f25b7d99"
}

// init firebase
firebase.initializeApp(fbconfig)

// init firebase ui widget
let ui = new firebaseui.auth.AuthUI(firebase.auth())
let db = firebase.firestore()
let uiconfig = {
	callbacks: {
		signInSuccessWithAuthResult: function (authResult, redirectUrl) {
			var user = authResult.user
			if (authResult.additionalUserInfo.isNewUser) {
				db.collection("users").doc(user.uid).set({
					name: user.displayName,
					email: user.email
				}).then(_ => {
					console.log("New user added to firestore")
					window.location.assign(redirectUrl)
				}).catch(error => {
					console.log("Error adding new user: " + error)
				})
				return false
			} else {
				return true
			}
		}
	},
	signInFlow: "popup",
	signInSuccessUrl: "main.html",
	signInOptions: [ firebase.auth.EmailAuthProvider.PROVIDER_ID ],
	tosUrl: "<your-tos-url>",
	privacyPolicyUrl: "<your-privacy-policy-url>"
}

ui.start("main", uiconfig)
