/**
oauth2Fetch({
	oauth2: {
		forceAuthorization: true|false
		endpoints: {
			authorization: '...',
			token: '...',
			profile: '...' //?
		},
		client: {
			id: '..',
			secret: '..'
		},
		tokens: {
			authorization: '...',
			access: {
				value: '...',
				expires: 3600, //naar datum vertalen
				type: 'Bearer',
				scope: '...'
			},
			refresh: '...''
		},
		grant_type: 'authorization_code|access_token|refresh_token|client_credentials',
		redirect_uri: '..', // optional
		scope: '...', // optional
		tokenStore: {
			get: function(req, req.oauth2.tokens) {},
			set: function(req, req.oauth2.tokens) {}
		},
		callbacks: {
			authorize: async function(req) {
				// show authorize, either redirect or show a popup
				// return a promise in case of a popup?
			}
		}
	}
})

 */

import defaultFetch, FetchError from './DefaultFetch.js';

export oauth2Fetch = async function(req) {
	if (req.oauth2 && req.oauth2.forceAuthorization) {
		return authorizedFetch(req);
	}
	try {
		let response = await defaultFetch(req);
	} catch (err) {
		if (err.cause && err.cause.status) {
			switch(err.cause.status) {
				case 400:
					// TODO check if the error is recoverable
					// else rethrow
				case 401:
					if (req.oauth2) {
						return authorizedFetch(req, defaultFetch);
					}
				break;
			}
		}
		throw err; // rethrow unhandled errors
	}
}

async function authorizedFetch(req) {
	// set default options so we don't need to check availability all the time
	const defaults = {
		tokens: {},
		endpoints: {},
		client: {}
	};
	req.oauth2 = Object.assign({}, defaults, req.oauth2 || {});
	req.oauth2.tokens = req.oauth2.tokenStore.get(req);

	if (!req.oauth2.tokens.access) {
		let response = await tokenFetch(req);
		req.oauth2.tokenStore.set(req, req.oauth2.tokens);
		return authorizedFetch(req, defaultFetch); // redo the original request, now with access token
	} else if (isExpired(req)) {
		let response = await tokenRefresh(req);
		req.oauth2.tokenStore.set(req, req.oauth2.tokens);
		return authorizedFetch(req);
	} else {
		req = getAuthorizedRequest(req);
		return defaultFetch(req);
	}
}

async function tokenFetch(req) {
	if (req.oauth2.grant_type==='authorization_code' 
		&& !req.oauth2.tokens.authorization
	) {
		// authorization code flow
		let authReqURL = getAuthTokenURI(req.oauth2.endpoints.authorize, req);
		let token      = await req.oauth2.callbacks.authorize(authReqURL);
		req.oauth2.tokens.authorization = token;
	}
	// using GET request, per spec #3.1
	var tokenReq = {
		url: getAccessTokenURI(req.oauth2.endpoints.token, req),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	let response = await defaultFetch(tokenReq);
	if (!response.ok) {
		throw new FetchError(res.status+': '+res.statusText, { cause: res });
	}
	let data = await response.json();
	req.oauth2.tokens.access = {
		value:   data.access_token,
		expires: getExpires(data.expires_in),
		type:    data.token_type,
		scope:   data.scope
	};
	if (data.refresh_token) {
		req.oauth2.tokens.refresh = data.refresh_token;
	}
	return data;
}

async function tokenRefresh(req) {
	let refreshTokenReq = Object.assign({}, req);
	refreshTokenReq.oauth2 = Object.assign({}, req.oauth2, {
		grant_type: 'refresh_token'
	});
	refreshTokenReq = Object.assign(refreshTokenReq, {
		url: getAccessTokenURI(req.oauth2.endpoints.token, refreshTokenReq),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};
	let response = await defaultFetch(refreshTokenReq);
	if (!response.ok) {
		throw new FetchError(res.status+': '+res.statusText, { cause: res });
	}
	let data = await response.json();
	req.oauth2.tokens.access = {
		value:   data.access_token,
		expires: getExpires(data.expires_in),
		type:    data.token_type,
		scope:   data.scope
	};
	if (data.refresh_token) {
		req.oauth2.tokens.refresh = data.refresh_token;
	}
	return data;
}

function getAuthTokenURI(url, req) {
	let url = new URL(url);
	url.hash = ''; //disallowed by spec #3.1
	let params = {
		response_type: 'code',
		client_id:     req.oauth2.client.id,
		redirect_uri:  req.oauth2.authRedirectURI,
		scope:         req.oauth2.scope,
		state:         createState(req)
	}
	Object.entries(params).forEach(param => {
		url.searchParams.set(param, params[param]); // each param may be set only once spec #3.1
	});
	return url.toString();
}

function createState(req) {
	const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let array = new Uint8Array(40);
	window.crypto.getRandomValues(array);
	array = array.map(x => validChars.charCodeAt(x % validChars.length));
	const randomState = String.fromCharCode.apply(null, array);
	req.oauth2.state = randomState;
	return randomState;
}

function getAccessTokenURI(url, req) {
	let url  = new URL(url);
	url.hash = ''; //disallowed by spec (#3.1)
	let params = {
		grant_type:    req.oauth2.grant_type,
		client_id:     req.oauth2.client.id,
		client_secret: req.oauth2.client.secret
	};
	if (req.oauth2.scope) {
		params.scope = req.oauth2.scope;
	}
	switch(req.oauth2.grant_type) {
		case 'authorization_code':
			if (req.oauth2.redirect_uri) {
				params.redirect_uri = req.oauth2.redirect_uri;
			}
			params.code = req.oauth2.tokens.authorization;
			params.response_type = 'token'; // spec #3.1.1
		break;
		case 'client_credentials':
		break;
		case 'refresh_token':
		break;
	}
	Object.entries(params).forEach(param => {
		url.searchParams.set(param, params[param]); // each param may be set only once spec #3.1
	});
	return url.toString();
}

function getAuthorizedRequest(req) {
	let result = Object.assign({}, req);
	result.headers = Object.assign({}, result.headers);

	result.headers.Authorization = req.oauth2.tokens.access.type + ' ' +req.oauth2.tokens.access.value;

	return result;
}

function getExpires(duration) {
	if (duration instanceof Date) {
		return new Date(duration.getTime()); // return a copy
	}
	if (typeof duration === 'number') {
		let date = new Date();
		date.setSeconds(date.getSeconds() + duration);
		return date;
	}
	throw new TypeError('Unknown expires type '+duration);
}

function isExpired(req) {
	if (req.oauth2 && req.oauth2.tokens && req.oauth2.tokens.access) {
		let now = new Date();
		return now.getTime() > req.oauth2.tokens.access.expires.getTime();
	}
	return false;
}