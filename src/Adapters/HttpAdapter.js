import Path from './Path.js';

export default class HttpAdapter {
    
    #url;
    #path;
    #exceptionHandler;
    #fetchParams;

    constructor(url, exceptionHandler=null, fetchParams={}) {
        this.#url = url;
        let u = new URL(url);
        this.#path = new Path(u.pathname);
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

    supportsStreaminRead() {
        return true;
    }

    cd(path) {
        if (!Path.isPath(path)) {
            throw new TypeError(path+' is not a valid path');
        }
        let url = new URL(path, this.#url);
        return new HttpAdapter(url.href);
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
        return this.read(path)
            .then(response => {
                if (response.ok) {
                    let contentType = response.headers.get('Content-Type').split(';')[0];
                    if (supportedContentTypes.includes(contentType)) {
                        return response.text();
                    } else {
                        throw new TypeError('URL '+this.#url+' is not of a supported content type', {
                            cause: response
                        });
                    }
                } else {
                    throw response
                }
            })
            .then(html => {
                let parentUrl = new URL(this.#url);
                let dom = document.createElement('template');
                dom.innerHTML = html;
                let links = dom.content.querySelectorAll('a[href]');
                links = Array.from(links).filter(link => {
                    // show only links that have the current URL as direct parent
                    let parentLink = link.cloneNode();
                    parentLink.pathname = Path.parent(parentLink.pathname);
                    // this also filters out links with extra query string of fragment hash -- is that correct? @TODO
                    return parentLink.href===parentUrl.href;
                });
                return links.map(link => {
                    return {
                        filename: Path.filename(link.pathname),
                        path: link.pathname,
                        name: link.innerText
                    }
                });
            });
    }

    async #fetch(path, options) {
        let url = new URL(path, this.#url);
        return fetch(url, options)
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