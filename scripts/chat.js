const el = document.querySelector(".messages")

const state = {
	user: "instant_noodle",
	messages: [
		{ time: null, author: "bboberts", content: "Wait" },
		{ time: null, author: "bboberts", content: "What happened??" },
		{ time: null, author: "instant_noodle", content: "A semi got rearended off marine right before the loop" }
	]
}

const renderMessage = (message, state) =>
	message.author === state.user
		? div({ class: "message -user" }, [ message.content ])
		: div({ class: "message" }, [ message.content ])

for (let msgdata of state.messages) {
	let msg = renderMessage(msgdata, state)
	el.appendChild(msg)
}
