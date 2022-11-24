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
        return supportsRequestStreams;
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

    //FIXME: return a jsfs result object instead of http response
    async write(path, contents, metadata=null) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'PUT',
            body: contents
        });
        return this.#fetch(path, params);
    }

    writeStream(path, writer, metadata=null) {
        throw new Error('Not yet implemented')
    }

    async read(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: 'GET'
        });
        let response = await this.#fetch(path, params);
        //TODO: create a special jsfsFile class
        //with a toString that returns the contents
        //or better: mimic the File class of the browser
        let result = {
            type: this.#getMimetype(response),
            name: Path.filename(path),
            http: {
                headers: response.headers,
                status: response.status,
                url: response.url
            }
        }
        if (result.type.match(/text\/.*/)) {
            result.contents = await response.text()
        } else if (result.type.match(/application\/json.*/)) {
            result.contents = await response.json()
        } else {
            result.contents = await response.blob()
        }
        return result
    }

    readStream(path, reader) {
        throw new Error('Not yet implemented')
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
        let result = await this.read(path)
        if (supportedContentTypes.includes(result.type.split(';')[0])) {
            var html = result.contents
        } else {
            let url = this.#getUrl(path);
            throw new TypeError('URL '+url+' is not of a supported content type', {
                cause: result
            });                
        }

        let basePath = Path.collapse(this.#baseUrl.pathname);
        let parentUrl = this.#getUrl(path);
        // TODO: use DOMParser() directly here
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

    #getMimetype(response) {
        if (response.headers.has('Content-Type')) {
            return response.headers.get('Content-Type')
        } else {
            return null
        }
    }
}

const supportsRequestStreams = (async () => {
    const supportsStreamsInRequestObjects = !new Request(
        '', 
        {
            body: new ReadableStream(),
            method: 'POST',
            duplex: 'half' // required in chrome
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
            duplex: 'half'
        }
    )
    .then(() => true, () => false);
})();