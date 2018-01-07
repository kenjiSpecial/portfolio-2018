const EventEmitter = require('wolfy87-eventemitter');

import { mat4 } from 'gl-matrix/src/gl-matrix';
import { Loader } from './works/loader';
import { appModel } from './model/appModel';
import { ThumbnailPlane } from './works/thumbnailPlane';

export class WorksThumbnail extends EventEmitter {
	constructor(gl, params = {}) {
		super();

		this._time = 0;
		this._gl = gl;
		this._modelMatrix = mat4.create();

		this._makeLoaders();
		appModel.addListener('image:loaded', this._loadedHandler.bind(this));
	}
	_loadedHandler() {
		this._plane = new ThumbnailPlane(this._gl, 100, 100, 10, 10, {
			isWire: true
		});
	}
	_makeLoaders() {
		this._loader = new Loader(this._gl);
	}

	render(camera, mouse) {
		this._time += 1 / 60;

		if (this._plane) this._plane.render(camera);

		if (this._loader.animateOutRate !== 0.0) {
			this._loader.render(camera, this._modelMatrix, mouse, this._time);
		}
	}
	animateIn() {
		this._loader.animateIn();
	}
	resize() {}
}
