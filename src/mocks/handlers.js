import { rest } from 'msw'

//FIXME: mock server should respond with correct error responses according to oauth2 spec
//use sessionStorage to store tokens and check them instead of hardcoding values

export const handlers = [

    rest.get('https://authorize-server.mock/authorize', (req, res, ctx) => {
        let expectedParams = {
            response_type: 'code',
            client_id:     'clientId',
            state:         '*'
        }
        let optionalParams = {
            redirect_uri:  '*'
        }
        try {
            checkParams(req.url.searchParams, expectedParams, optionalParams);
        } catch(error) {
            return errorResponse(error)
        }
        return res(
            ctx.status(200),
            ctx.json({
                code:  'authorizeToken',
                state: req.url.searchParams.state
            })
        )
    }),

    rest.get('https://authorize-server.mock/token', (req, res, ctx) => {
        try {
            checkParams(req.url.searchParams, {
                grant_type: ['refresh_token','authorization_code']
            }, '*')
        } catch(error) {
            return errorResponse(error)
        }
        switch(req.url.searchParams.get('grant_type')) {
            case 'refresh_token':
                var expectedParams = {
                    grant_type:    'refresh_token',
                    refresh_token: 'refresh',
                    client_id:     'clientId',
                    client_secret: 'clientSecret'
                }
                var optionalParams = {
                    redirect_uri:  '*'
                }
            break;
            case 'authorization_code':
                var expectedParams = {
                    grant_type:    'refresh_token',
                    refresh_token: 'refresh',
                    client_id:     'clientId',
                    client_secret: 'clientSecret'
                }
                var optionalParams = {
                    redirect_uri:  '*'
                }
            break;
            default:
            	return errorResponse(new Error('Unknown value for grant_type parameter, expected "refresh_token" or "authorization_code", got: "'+req.url.searchParams.get('grant_type')))
            break;
        }
        try {
            checkParams(req.url.searchParams, expectedParams, optionalParams);
        } catch(error) {
            return errorResponse(error)
        }

        return res(
            ctx.status(200),
            ctx.json({
               access_token:      'accessToken',
               token_type:        'example',
               expires_in:        3600,
               refresh_token:     'refreshToken',
               example_parameter: 'example_value'
            })
        )
    }),

    rest.get('https://authorize-server.mock/', (req, res, ctx) => {
    	return res(
    		ctx.status(404),
    		ctx.body('404 Not Found')
    	)
    })
]

//FIXME: check correct error format for oauth2 
errorResponse(error, code=406) {
	return res(
		ctx.status(code),
		ctx.json({
			error: code,
			message: ''+error
		})
	)
}

checkParams(params, expected, optional=null) {
	Object.keys(expected).forEach(expect => {
		if (!params.has(expect) {
			throw new Error('Missing required parameter '+expect)
		})
		if (!matches(params.get(expect),expected[expect])) {
			throw new Error('Parameter '+expect+' does not match expected value: "'+expected[expect]+'"')
		}
	})
	if (optional && typeof optional === 'object') {
		Object.keys(optional).forEach(option => {
			if (params.has(option)) {
				if (!matches(params.get(option))) {
					throw new Error('Parameter '+option+' does not match expected value: "'+optional[option]+'"')
				}
			}
		})
	}
	if (typeof optional === 'object') {
		params.keys().forEach(param => {
			if (typeof expected[param] === 'undefined' && typeof optional[param] === 'undefined') {
				throw new Error('Uknown parameter '+param+' in request');
			}
		})		
	}
}