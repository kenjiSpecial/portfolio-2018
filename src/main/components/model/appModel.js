const EventEmitter = require('wolfy87-eventemitter');

class AppModel extends EventEmitter {
	constructor() {
		super();
		this._page = this.prevPage = 'home';
		this.isPageTransition = false;
		this._isRollover = this.isPrevRollover = false;
		this.isLoaded = false;
	}
	animationDone() {
		this.isPageTransition = false;

		this.trigger('updatePage:done');
	}
	loadedHandler() {
		this.isLoaded = true;

		this.trigger('image:loaded');
	}
	get page() {
		return this._page;
	}
	set page(value) {
		this.isPageTransition = true;
		this.prevPage = this._page;
		this._page = value;

		this.trigger('updatePage');
	}
	get isRollover() {
		return this._isRollover;
	}
	set isRollover(value) {
		this.isPrevRollover = this._isRollover;
		this._isRollover = value;
	}
}

export let appModel = new AppModel();
