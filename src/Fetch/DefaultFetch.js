export function defaultFetch(req) {
	return fetch(req)
	.then(res => {
		if (!res.ok) {
			throw new FetchError(res.status+': '+res.statusText, { cause: res });
		}
		return res
	});
}

export class FetchError extends Error {}