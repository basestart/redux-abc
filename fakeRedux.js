function createStore (reducer, initState, enhencer) {
	if(enhencer !== undefined) {
		return enhencer(createStore)(reducer, initState);
	}

	let currentState = initState;
	let currentReducer = reducer;
	let listeners = [];

	function getState () {
		return currentState;
	}

	function dispatch (action) {
		currentState = currentReducer(currentState, action);
		for(let i = 0; i < listeners.length; ++i) {
			listeners[i]();
		}
	}

	function subscribe (listener) {
		listeners.push(listener);
		return function (listener) {
			unSubscribe(listener);
		}
	}

	function unsubscribe(listener) {
		let index = listeners.indexOf(listener);
		listeners.splice(index, 1);
	}

	return {
		getState,
		dispatch,
		subscribe
	}
}

function loggerEnhencer (createStore) {
	return function (reducer, initState) {
		let store = createStore(reducer, initState);
		function dispatch (action) {
			console.log(`dispatching an action : ${JSON.stringify(action)}`);
			const res = store.dispatch(action);
			const newState = store.getState();
			console.log(`current state : ${JSON.stringify(newState)}`);
			return res;
		}
		return {
			...store,
			dispatch
		}
	}
}