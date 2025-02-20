(() => {
  // src/Path.js
  var Path = class _Path {
    #value;
    constructor(path) {
      this.#value = _Path.collapse(path);
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
      if (path instanceof _Path) {
        return path.value;
      }
      if (typeof path !== "string") {
        throw new TypeError("path argument must be a string or an instance of Path");
      }
      if (cwd && !(cwd instanceof _Path)) {
        cwd = new _Path(cwd);
      }
      path = path.trim();
      if (path.length === 0) {
        return cwd.value;
      }
      if (_Path.isRelative(path)) {
        path = cwd + path;
      }
      let pathnames = _Path.reduce(path, (result2, entry) => {
        if (entry == "..") {
          result2.pop();
        } else if (entry !== ".") {
          result2.push(entry);
        }
        return result2;
      }, []);
      let result = "/";
      if (pathnames.length) {
        result += pathnames.join("/");
        if (_Path.isFolder(path)) {
          result += "/";
        }
      }
      return result;
    }
    static isAbsolute(path) {
      if (path instanceof _Path) {
        return true;
      }
      return path.length && path[0] === "/";
    }
    static isRelative(path) {
      return !_Path.isAbsolute(path);
    }
    static isFolder(path) {
      if (path instanceof _Path) {
        path = path.value;
      }
      return path.length && path[path.length - 1] == "/";
    }
    static isPath(path) {
      if (path instanceof _Path) {
        return true;
      }
      if (typeof path !== "string") {
        return false;
      }
      path = path.trim();
      let u = new URL(path, document.location);
      return u.pathname == path;
    }
    static reduce(path, reducer, initial) {
      if (path instanceof _Path) {
        path = path.value;
      }
      return path.split("/").filter(Boolean).reduce(reducer, initial);
    }
    static map(path, callback) {
      if (path instanceof _Path) {
        path = path.value;
      }
      return path.split("/").filter(Boolean).map(callback);
    }
    static parent(path) {
      if (path instanceof _Path) {
        path = path.value;
      }
      path = path.split("/").filter(Boolean);
      path.pop();
      let result = "/";
      if (path.length) {
        result += path.join("/") + "/";
      }
      return result;
    }
    static filename(path) {
      if (path instanceof _Path) {
        path = path.value;
      }
      return path.split("/").filter(Boolean).pop();
    }
    static head(path) {
      if (path instanceof _Path) {
        path = path.value;
      }
      return path.split("/").filter(Boolean).shift();
    }
    static tail(path) {
      if (path instanceof _Path) {
        path = path.value;
      }
      path = path.split("/").filter(Boolean);
      path.shift();
      let result = "/";
      if (path.length) {
        result += path.join("/") + "/";
      }
      return result;
    }
  };

  // src/FileSystem.js
  var FileSystem = class _FileSystem {
    #adapter;
    #path = "/";
    constructor(adapter) {
      this.#adapter = adapter;
      this.#path = this.#adapter.path;
    }
    get path() {
      return this.#path;
    }
    cd(path) {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      return new _FileSystem(this.#adapter.cd(path));
    }
    async read(path, reader = null) {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      if (typeof reader === "function") {
        if (!this.#adapter.supportsStreamingRead()) {
          throw new Error("Adapter " + this.#adapter.name + " does not support streaming reading.");
        }
        return this.#adapter.readStream(path, reader);
      } else {
        return this.#adapter.read(path);
      }
    }
    async write(path, contents, metadata = null) {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      if (!this.#adapter.supportsWrite()) {
        throw new Error("Adapter " + this.#adapter.name + " is read only.");
      }
      if (typeof contents === "function") {
        if (!this.#adapter.supportsStreamingWrite()) {
          throw new Error("Adapter " + this.#adapter.name + " does not support streaming writing.");
        }
        return this.#adapter.writeStream(path, contents, metadata);
      } else if (typeof contents === "string") {
        return this.#adapter.write(path, contents, metadata);
      } else {
        throw new TypeError("Cannot write contents of type " + typeof contents);
      }
    }
    async delete(path) {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      return this.#adapter.delete(path);
    }
    async exists(path) {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      return this.#adapter.exists(path);
    }
    async list(path = "") {
      if (!(path instanceof Path)) {
        path = new Path(Path.collapse(path, this.#path));
      }
      return this.#adapter.list(path);
    }
  };

  // src/Adapters/HttpAdapter.js
  var HttpAdapter = class _HttpAdapter {
    #baseUrl;
    #path;
    #exceptionHandler;
    #fetchParams;
    constructor(baseUrl, path = "/", exceptionHandler = null, fetchParams = {}) {
      this.#baseUrl = new URL(baseUrl, window.location.href);
      this.#path = new Path(path);
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
      return supportsRequestStreams;
    }
    supportsStreamingRead() {
      return true;
    }
    cd(path) {
      if (!Path.isPath(path)) {
        throw new TypeError(path + " is not a valid path");
      }
      return new _HttpAdapter(this.#baseUrl.href, path);
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
      let result = {
        type: this.#getMimetype(response),
        name: Path.filename(path),
        http: {
          headers: response.headers,
          status: response.status,
          url: response.url
        }
      };
      if (result.type.match(/text\/.*/)) {
        result.contents = await response.text();
      } else if (result.type.match(/application\/json.*/)) {
        result.contents = await response.json();
      } else {
        result.contents = await response.blob();
      }
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
      if (supportedContentTypes.includes(result.type.split(";")[0])) {
        var html = result.contents;
      } else {
        let url2 = this.#getUrl(path);
        throw new TypeError("URL " + url2 + " is not of a supported content type", {
          cause: result
        });
      }
      let basePath = Path.collapse(this.#baseUrl.pathname);
      let parentUrl = this.#getUrl(path);
      let dom = document.createElement("template");
      dom.innerHTML = html;
      let links = dom.content.querySelectorAll("a[href]");
      return Array.from(links).map((link) => {
        let url2 = new URL(link.getAttribute("href"), parentUrl.href);
        link.href = url2.href;
        return {
          filename: Path.filename(link.pathname),
          path: link.pathname,
          name: link.innerText,
          href: link.href
        };
      }).filter((link) => {
        let testURL = new URL(link.href);
        testURL.pathname = Path.parent(testURL.pathname);
        return testURL.href === parentUrl.href;
      }).map((link) => {
        return {
          filename: link.filename,
          path: link.path.substring(basePath.length - 1),
          //TODO: Path.collapse() now always adds a trailing '/', so this works, but the added trailing / is probably not correct
          name: link.name
        };
      });
    }
    #getUrl(path) {
      path = Path.collapse(this.#baseUrl.pathname + Path.collapse(path));
      return new URL(path, this.#baseUrl);
    }
    async #fetch(path, options) {
      return fetch(this.#getUrl(path), options).catch((e) => {
        if (!this.#exceptionHandler || !this.#exceptionHandler(url, options, e)) {
          throw e;
        }
      });
    }
    #getMimetype(response) {
      if (response.headers.has("Content-Type")) {
        return response.headers.get("Content-Type");
      } else {
        return null;
      }
    }
  };
  var supportsRequestStreams = (async () => {
    const supportsStreamsInRequestObjects = !new Request(
      "",
      {
        body: new ReadableStream(),
        method: "POST",
        duplex: "half"
        // required in chrome
      }
    ).headers.has("Content-Type");
    if (!supportsStreamsInRequestObjects) {
      return false;
    }
    return fetch(
      "data:a/a;charset=utf-8,",
      {
        method: "POST",
        body: new ReadableStream(),
        duplex: "half"
      }
    ).then(() => true, () => false);
  })();

  // src/browser.js
  var jsfs = {
    fs: FileSystem,
    adapters: {
      https: HttpAdapter
    },
    path: Path
  };
  window.jsfs = jsfs;
  var browser_default = jsfs;
})();
//# sourceMappingURL=browser.js.map
