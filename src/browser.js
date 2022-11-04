import JSFS from './FileSystem.js'
import HttpAdapter from './Adapters/HttpAdapter.js'

window.JSFS = new JSFS(new HttpAdapter)
