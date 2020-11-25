// init firebase ui widget
new firebaseui.auth.AuthUI(firebase.auth()).start("main", {
	callbacks: {
		signInFailure: (error) => {
			if (error.code !== "firebaseui/anonymous-upgrade-merge-conflict") {
				return Promise.resolve();
			}
			return firebase.auth().signInWithCredential(error.credential)
		},
		signInSuccessWithAuthResult: (authResult, redirectUrl) => {
			let user = authResult.user
			if (authResult.additionalUserInfo.isNewUser) {
				db.collection("users").doc(user.uid).set({
					name: user.displayName,
					email: user.email,
					saves: []
				}).then(_ => {
					console.log("New user added to firestore")
					window.location.assign("index.html")
				}).catch(error => {
					console.log("Error adding new user: " + error)
				})
				return false
			} else {
				return true
			}
		}
	},
	autoUpgradeAnonymousUsers: true,
	signInFlow: "popup",
	signInSuccessUrl: "index.html",
	signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID]
})
