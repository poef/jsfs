import JSFS from './FileSystem.js'
import HttpAdapter from './Adapters/HttpAdapter.js'
import Path from './Path.js'

const jsfs = {
	fs: JSFS,
	adapters: {
		https: HttpAdapter
	},
	path: Path
}
window.jsfs = jsfs

export default jsfs