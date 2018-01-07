import elwoodImageURL from '../../../assets/elwood.jpg';
import adidasImageURL from '../../../assets/adidas.jpg';
import hotImageURL from '../../../assets/hot.jpg';
import { Texture } from 'tubugl-core/src/texture';
import { appModel } from '../model/appModel';

const EventEmitter = require('wolfy87-eventemitter');
require('gsap');

export class ImageLoader extends EventEmitter {
	constructor() {
		super();

		this.assets = [
			{ name: 'elwood', url: elwoodImageURL, image: null, texture: null },
			{ name: 'adidas', url: adidasImageURL, image: null, texture: null },
			{ name: 'hot', url: hotImageURL, image: null, texture: null }
		];

		this._loadedCnt = 0;
		this._minLoadingDuration = 2;
	}
	setGL(gl) {
		this._gl = gl;
	}
	startLoad() {
		this._startTime = +new Date();
		for (let ii = 0; ii < this.assets.length; ii++) {
			let image = new Image();
			image.onload = this._onload.bind(this, this.assets[ii]);
			image.src = this.assets[ii].url;
			this.assets[ii].image = image;
			this.assets[ii].texture = new Texture(this._gl);
		}
	}
	_onload(vars) {
		vars.texture
			.bind()
			.fromImage(vars.image, vars.image.width, vars.image.height)
			.generateMipmap();
		this._loadedCnt++;
		if (this._loadedCnt === this.assets.length) {
			let time = (+new Date() - this._startTime) / 1000;
			if (time > this._minLoadingDuration) {
				this._loadedHandler();
			} else {
				TweenMax.delayedCall(
					this._minLoadingDuration - time,
					this._loadedHandler,
					null,
					this
				);
			}
		}
	}
	_loadedHandler() {
		appModel.loadedHandler();
	}
}

export let imageloader = new ImageLoader();
