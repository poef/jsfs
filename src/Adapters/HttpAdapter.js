import Path from '../Path.js';

export default class HttpAdapter {
    
    #baseUrl;
    #path;
    #exceptionHandler;
    #fetchParams;

    constructor(baseUrl, path='/', exceptionHandler=null, fetchParams={}) {
        this.#baseUrl = new URL(baseUrl, window.location.href);
        this.#path = new Path(path);
        this.#exceptionHandler = exceptionHandler;
        this.#fetchParams = fetchParams;
    }

    get name() {
        return 'HttpAdapter';
    }

    get path() {
        return this.#path;
    }

    supportsWrite() {
        return true;
    }

    supportsStreamingWrite() {
        return supportsRequestStreamsP;
    }

    supportsStreamingRead() {
        return true;
    }

    cd(path) {
        if (!Path.isPath(path)) {
            throw new TypeError(path+' is not a valid path');
        }
        return new HttpAdapter(this.#baseUrl.href, path);
    }

    async write(path, contents, metadata=null) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'PUT',
            body: contents
        });
        return this.#fetch(path, params);
    }

    writeStream(path, writer, metadata=null) {

    }

    async read(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'GET'
        });
        return this.#fetch(path, params);
    }

    readStream(path, reader) {

    }

    async exists(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'HEAD'
        });
        return this.#fetch(path, params);
    }

    async delete(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'DELETE'
        });
        return this.#fetch(path, params);
    }

    async list(path) {
        let supportedContentTypes = [
            'text/html','text/xhtml','text/xhtml+xml','text/xml'
        ];
        let response = await this.read(path)
        if (response.ok) {
            let contentType = response.headers.get('Content-Type').split(';')[0];
            if (supportedContentTypes.includes(contentType)) {
                var html = await response.text();
            } else {
                let url = this.#getUrl(path);
                throw new TypeError('URL '+url+' is not of a supported content type', {
                    cause: response
                });
            }
        } else {
            throw response
        }

        let basePath = Path.collapse(this.#baseUrl.pathname);
        let parentUrl = this.#getUrl(path);
        let dom = document.createElement('template');
        dom.innerHTML = html;
        let links = dom.content.querySelectorAll('a[href]');

        return Array.from(links)
        .map(link => {
            // use getAttribute to get the unchanged href value
            // otherwise relative hrefs will be turned into absolute values relative to the current window.location
            // instead of the path used in list()
            let url = new URL(link.getAttribute('href'), parentUrl.href); 
            link.href = url.href;
            return {
                filename: Path.filename(link.pathname),
                path: link.pathname,
                name: link.innerText,
                href: link.href
            }
        })
        .filter(link => {
            // show only links that have the current URL as direct parent
            let testURL = new URL(link.href)
            testURL.pathname = Path.parent(testURL.pathname);
            return testURL.href===parentUrl.href;
        })
        .map(link => {
            return {
                filename: link.filename,
                path: link.path.substring(basePath.length-1), //TODO: Path.collapse() now always adds a trailing '/', so this works, but the added trailing / is probably not correct
                name: link.name
            }
        })
    }

    #getUrl(path) {
        path = Path.collapse(this.#baseUrl.pathname + Path.collapse(path));
        return new URL(path, this.#baseUrl);
    }

    async #fetch(path, options) {
        return fetch(this.#getUrl(path), options)
        .catch(e => {
            if (!this.#exceptionHandler || !this.#exceptionHandler(url, options, e)) {
                throw e;
            }
        })
    }
}

const supportsRequestStreamsP = (async () => {
    const supportsStreamsInRequestObjects = !new Request(
        '', 
        {
            body: new ReadableStream(),
            method: 'POST',
        }
    )
    .headers.has('Content-Type');

    if (!supportsStreamsInRequestObjects) {
        return false;
    }

    return fetch(
        'data:a/a;charset=utf-8,', 
        {
            method: 'POST',
            body: new ReadableStream(),
        }
    )
    .then(() => true, () => false);
})();