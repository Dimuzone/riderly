// init firebase ui widget
let ui = new firebaseui.auth.AuthUI(firebase.auth())
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
