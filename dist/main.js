class $28a5e24fd627cc25$export$2e2bcd8739ae039 {
    #value;
    constructor(path){
        this.#value = $28a5e24fd627cc25$export$2e2bcd8739ae039.collapse(path);
    }
    get value() {
        return this.#value;
    }
    toString() {
        return this.#value;
    }
    get length() {
        return this.#value.length;
    }
    static collapse(path, cwd = "") {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) return path.value;
        if (typeof path !== "string") throw new TypeError("path argument must be a string or an instance of Path");
        if (cwd && !(cwd instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039)) cwd = new $28a5e24fd627cc25$export$2e2bcd8739ae039(cwd);
        path = path.trim();
        if (path.length === 0) return cwd.value;
        if ($28a5e24fd627cc25$export$2e2bcd8739ae039.isRelative(path)) path = cwd + path;
        let pathnames = $28a5e24fd627cc25$export$2e2bcd8739ae039.reduce(path, (result, entry)=>{
            if (entry == "..") result.pop();
            else if (entry !== ".") result.push(entry);
            return result;
        }, []);
        let result = "/";
        if (pathnames.length) {
            result += pathnames.join("/");
            if ($28a5e24fd627cc25$export$2e2bcd8739ae039.isFolder(path)) result += "/";
        }
        return result;
    }
    static isAbsolute(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) return true;
        return path.length && path[0] === "/";
    }
    static isRelative(path) {
        return !$28a5e24fd627cc25$export$2e2bcd8739ae039.isAbsolute(path);
    }
    static isFolder(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        return path.length && path[path.length - 1] == "/";
    }
    static isPath(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) return true;
        if (typeof path !== "string") return false;
        path = path.trim();
        let u = new URL(path, document.location);
        return u.pathname == path;
    }
    static reduce(path, reducer, initial) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        return path.split("/").filter(Boolean).reduce(reducer, initial);
    }
    static map(path, callback) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        return path.split("/").filter(Boolean).map(callback);
    }
    static parent(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        path = path.split("/").filter(Boolean);
        path.pop();
        let result = "/";
        if (path.length) result += path.join("/") + "/";
        return result;
    }
    static filename(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        return path.split("/").filter(Boolean).pop();
    }
    static head(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        return path.split("/").filter(Boolean).shift();
    }
    static tail(path) {
        if (path instanceof $28a5e24fd627cc25$export$2e2bcd8739ae039) path = path.value;
        path = path.split("/").filter(Boolean);
        path.shift();
        let result = "/";
        if (path.length) result += path.join("/") + "/";
        return result;
    }
}


class $f766e2be53780776$export$2e2bcd8739ae039 {
    #adapter;
    #path = "/";
    constructor(adapter){
        this.#adapter = adapter;
        this.#path = this.#adapter.path;
    }
    get path() {
        return this.#path;
    }
    cd(path) {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        return new $f766e2be53780776$export$2e2bcd8739ae039(this.#adapter.cd(path));
    }
    async read(path, reader = null) {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        if (typeof reader === "function") {
            if (!this.#adapter.supportsStreamingRead()) throw new Error("Adapter " + this.#adapter.name + " does not support streaming reading.");
            return this.#adapter.readStream(path, reader);
        } else return this.#adapter.read(path);
    }
    async write(path, contents, metadata = null) {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        if (!this.#adapter.supportsWrite()) throw new Error("Adapter " + this.#adapter.name + " is read only.");
        if (typeof contents === "function") {
            if (!this.#adapter.supportsStreamingWrite()) throw new Error("Adapter " + this.#adapter.name + " does not support streaming writing.");
            return this.#adapter.writeStream(path, contents, metadata);
        } else if (typeof contents === "string") return this.#adapter.write(path, contents, metadata);
        else throw new TypeError("Cannot write contents of type " + typeof contents);
    }
    async delete(path) {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        return this.#adapter.delete(path);
    }
    async exists(path) {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        return this.#adapter.exists(path);
    }
    async list(path = "") {
        if (!(path instanceof (0, $28a5e24fd627cc25$export$2e2bcd8739ae039))) path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)((0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path, this.#path));
        return this.#adapter.list(path);
    }
}



class $7f6d864e2de13047$export$2e2bcd8739ae039 {
    #baseUrl;
    #path;
    #exceptionHandler;
    #fetchParams;
    constructor(baseUrl, path = "/", exceptionHandler = null, fetchParams = {}){
        this.#baseUrl = new URL(baseUrl, window.location.href);
        this.#path = new (0, $28a5e24fd627cc25$export$2e2bcd8739ae039)(path);
        this.#exceptionHandler = exceptionHandler;
        this.#fetchParams = fetchParams;
    }
    get name() {
        return "HttpAdapter";
    }
    get path() {
        return this.#path;
    }
    supportsWrite() {
        return true;
    }
    supportsStreamingWrite() {
        return $7f6d864e2de13047$var$supportsRequestStreams;
    }
    supportsStreamingRead() {
        return true;
    }
    cd(path) {
        if (!(0, $28a5e24fd627cc25$export$2e2bcd8739ae039).isPath(path)) throw new TypeError(path + " is not a valid path");
        return new $7f6d864e2de13047$export$2e2bcd8739ae039(this.#baseUrl.href, path);
    }
    //FIXME: return a jsfs result object instead of http response
    async write(path, contents, metadata = null) {
        let params = Object.assign({}, this.#fetchParams, {
            method: "PUT",
            body: contents
        });
        return this.#fetch(path, params);
    }
    writeStream(path, writer, metadata = null) {
        throw new Error("Not yet implemented");
    }
    async read(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: "GET"
        });
        let response = await this.#fetch(path, params);
        //TODO: create a special jsfsFile class
        //with a toString that returns the contents
        let result = {
            type: this.#getMimetype(response),
            name: (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).filename(path),
            http: {
                headers: response.headers,
                status: response.status,
                url: response.url
            }
        };
        if (result.type.match(/text\/.*/)) result.contents = await response.text();
        else if (result.type.match(/application\/json.*/)) result.contents = await response.json();
        else result.contents = await response.blob();
        return result;
    }
    readStream(path, reader) {
        throw new Error("Not yet implemented");
    }
    async exists(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: "HEAD"
        });
        return this.#fetch(path, params);
    }
    async delete(path) {
        let params = Object.assign({}, this.#fetchParams, {
            method: "DELETE"
        });
        return this.#fetch(path, params);
    }
    async list(path) {
        let supportedContentTypes = [
            "text/html",
            "text/xhtml",
            "text/xhtml+xml",
            "text/xml"
        ];
        let result = await this.read(path);
        if (supportedContentTypes.includes(result.type.split(";")[0])) var html = result.contents;
        else {
            let url1 = this.#getUrl(path);
            throw new TypeError("URL " + url1 + " is not of a supported content type", {
                cause: result
            });
        }
        let basePath = (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(this.#baseUrl.pathname);
        let parentUrl = this.#getUrl(path);
        // TODO: use DOMParser() directly here
        let dom = document.createElement("template");
        dom.innerHTML = html;
        let links = dom.content.querySelectorAll("a[href]");
        return Array.from(links).map((link)=>{
            // use getAttribute to get the unchanged href value
            // otherwise relative hrefs will be turned into absolute values relative to the current window.location
            // instead of the path used in list()
            let url1 = new URL(link.getAttribute("href"), parentUrl.href);
            link.href = url1.href;
            return {
                filename: (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).filename(link.pathname),
                path: link.pathname,
                name: link.innerText,
                href: link.href
            };
        }).filter((link)=>{
            // show only links that have the current URL as direct parent
            let testURL = new URL(link.href);
            testURL.pathname = (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).parent(testURL.pathname);
            return testURL.href === parentUrl.href;
        }).map((link)=>{
            return {
                filename: link.filename,
                path: link.path.substring(basePath.length - 1),
                name: link.name
            };
        });
    }
    #getUrl(path) {
        path = (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(this.#baseUrl.pathname + (0, $28a5e24fd627cc25$export$2e2bcd8739ae039).collapse(path));
        return new URL(path, this.#baseUrl);
    }
    async #fetch(path1, options) {
        return fetch(this.#getUrl(path1), options).catch((e)=>{
            if (!this.#exceptionHandler || !this.#exceptionHandler(url, options, e)) throw e;
        });
    }
    #getMimetype(response) {
        if (response.headers.has("Content-Type")) return response.headers.get("Content-Type");
        else return null;
    }
}
const $7f6d864e2de13047$var$supportsRequestStreams = (async ()=>{
    const supportsStreamsInRequestObjects = !new Request("", {
        body: new ReadableStream(),
        method: "POST",
        duplex: "half" // required in chrome
    }).headers.has("Content-Type");
    if (!supportsStreamsInRequestObjects) return false;
    return fetch("data:a/a;charset=utf-8,", {
        method: "POST",
        body: new ReadableStream()
    }).then(()=>true, ()=>false);
})();



window.JSFS = (0, $f766e2be53780776$export$2e2bcd8739ae039);
window.jsfsHttpAdapter = (0, $7f6d864e2de13047$export$2e2bcd8739ae039);
window.jsfsPath = (0, $28a5e24fd627cc25$export$2e2bcd8739ae039);


//# sourceMappingURL=main.js.map
