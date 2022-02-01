
export MockOAuth2Server = function MockOAuth2Server(req) {
	return new Promise(function(resolve, reject) {
		let url = new URL(req.url);
		switch(url.host) {
			case 'resource-owner.mock':
				// @spec #1.5 A/B
				// @spec #1.5 E/F
				switch(url.pathname) {
				}
			break;
			case 'authorization-server.mock':
				switch(url.pathname) {
					case 'authorize':
						// @spec #1.5 C/D (access token)
						if (!url.searchParams.has('response_type')) {
							throw new MockExpectError('OAuth2 authorize request: missing response_type=code parameter', {
								cause: req
							});
						}
						if (url.searchParams.get('response_type')!=='code') {
							throw new MockExpectError('OAuth2 authorize request: response_type value must be "code" instead of '+url.searchParams.get('response_type'), { cause: req });
						}
						if (!url.searchParams.has('client_id')) {
							throw new MockExpectError('OAuth2 authorize request: missing client_id parameter', {
								cause: req
							});
						}
						if (url.searchParams.get('client_id')!=='mockClientId') {
							throw new MockExpectError('OAuth2 authorize request: unexpected client_id value, expected "mockClientId", got: "'+url.searchParams.get('client_id').'"', {cause: req});
						}
						if (url.searchParams.has('redirect_uri')) {
							if (url.searchParams.get('redirect_uri')!=='https://client.mock/redirect') {
								throw new MockExpectError('OAuth2 authorize request: unexpected redirect_uri value, expected "https://client.mock/redirect", got: "'+url.searchParams.get('redirect_uri').'"', {cause: req});
							}
						}
						if (!url.searchParams.has('state')) {
							throw new MockExpectError('OAuth2 authorize request: missing state parameter', {
								cause: req
							});	
						}
						//Note: protocol expects to redirect a browser window/iframe
						//redirect_uri is called with code&state params in the URL
						//however we can shortcut that here and just resolve the promise
						//this does mean that we don't test if the authorize redirect_uri works
						resolve(MockResponse({
							code: 'authorizeToken',
							state: url.searchParams.state
						}));
					break;
					case 'token':
						if (!url.searchParams.has('grant_type')) {
							throw new MockExpectError('OAuth2 token request: missing grant_type=refresh_token parameter', {
								cause: req
							});
						}
						let grant_type = url.searchParams.get('grant_type');
						let grant_types = ['refresh_token','authorization_code'];
						if (grant_types.includes(grant_type)) {
							throw new MockExpectError('OAuth2 token request: grant_type value must be one of '+grant_types.join(', ')+' instead of '+url.searchParams.get('response_type'), { cause: req });
						}
						switch (grant_type) {
							case 'refresh_token':
								if (!url.searchParams.has('refresh_token')) {
									throw new MockExpectError('OAuth2 refresh token request: missing refresh_token parameter', {
										cause: req
									});
								}
								if (url.searchParams.get('refresh_token')!=='refreshToken') {
									throw new MockExpectError('OAuth2 refresh token request: response_type value must be "refresh_token" instead of '+url.searchParams.get('response_type'), { cause: req });
								}
								if (!url.searchParams.has('client_id')) {
									throw new MockExpectError('OAuth2 refresh token request: missing client_id parameter', {
										cause: req
									});
								}
								if (url.searchParams.get('client_id')!=='mockClientId') {
									throw new MockExpectError('OAuth2 refresh token request: unexpected client_id value, expected "mockClientId", got: "'+url.searchParams.get('client_id').'"', {cause: req});
								}
								if (!url.searchParams.has('client_secret')) {
									throw new MockExpectError('OAuth2 refresh token request: missing client_secret parameter', {
										cause: req
									});
								}
								if (url.searchParams.get('client_secret')!=='mockClientSecret') {
									throw new MockExpectError('OAuth2 refresh token request: unexpected client_secret value, expected "mockClientSecret", got: "'+url.searchParams.get('client_secret').'"', {cause: req});
								}
								resolve(MockResponse({
							       "access_token":"accessToken",
							       "token_type":"example",
							       "expires_in":3600,
							       "refresh_token":"refreshToken",
							       "example_parameter":"example_value"
							     }));
							break;
							case 'authorization_code':
								if (!url.searchParams.has('code')) {
									throw new MockExpectError('OAuth2 access token request: missing code parameter', {
										cause: req
									});
								}
								if (url.searchParams.get('code')!=='authorizeToken') {
									throw new MockExpectError('OAuth2 access token request: expected code value "authorizToken", instead of '+url.searchParams.get('code'), { cause: req });
								}
								if (url.searchParams.has('redirect_uri')) {
									//FIXME: cannot check if redirect_uri was present in authorize request here
									//if it was, it is required here as well
									if (url.searchParams.get('redirect_uri')!=='https://client.mock/redirect') {
										throw new MockExpectError('OAuth2 authorize request: unexpected redirect_uri value, expected "https://client.mock/redirect", got: "'+url.searchParams.get('redirect_uri').'"', {cause: req});
									}
								}
								if (!url.searchParams.has('client_id')) {
									throw new MockExpectError('OAuth2 authorize request: missing client_id parameter', {
										cause: req
									});
								}
								if (url.searchParams.get('client_id')!=='mockClientId') {
									throw new MockExpectError('OAuth2 authorize request: unexpected client_id value, expected "mockClientId", got: "'+url.searchParams.get('client_id').'"', {cause: req});
								}
								resolve(MockResponse({
							       "access_token":"accessToken",
							       "token_type":"example",
							       "expires_in":3600,
							       "refresh_token":"refreshToken",
							       "example_parameter":"example_value"
							     }));
							break;
						}
					break;
				}
			break;
			case 'client.mock':
			break;
		}
	});
}

export MockExpectError extends Error {
}

//TODO: the server now resolves with a javascript object
//it must resolve with a mock response object
//with a response.ok=true and response.json() method
//and Content-Type json header
export MockResponse {
	#body={};
	headers={
		'Content-Type':'application/json'
	};
	status=200;
	statusText='OK';
	
	constructor(body, init={}) {
		this.#body = body;
		['headers','status','statusText'].forEach(option => {
			if (init[option]) {
				this[option] = init[option];
			}
		});
	};

	get ok() {
		return this.status>=200 && this.status<400;
	}

	json() {
		return new Promise(function(resolve, reject) {
			resolve(this.#body);
		});
	}
}