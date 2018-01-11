const EventEmitter = require('wolfy87-eventemitter');

class AppModel extends EventEmitter {
	constructor() {
		super();
		this.isPageTransition = true;
		this.isLoaded = false;
		this.isInit = false;
		this._curWorkNum = this.prevWorkNum = 0;
		this._targetWorkSlideRate = this.prevTargetWorkSlideRate = 0;

		this._page = this.prevPage = 'home';
		this._isRollover = this.isPrevRollover = false;
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

	set curWorkNum(value) {
		this.prevWorkNum = this._curWorkNum;
		this._curWorkNum = value;

		this.trigger('updateWork');
	}

	get curWorkNum() {
		return this._curWorkNum;
	}

	set targetWorkSlideRate(value) {
		this.prevTargetWorkSlideRate = this._targetWorkSlideRate;
		this._targetWorkSlideRate = value;
	}

	get targetWorkSlideRate() {
		return this._targetWorkSlideRate;
	}

	showWork(num) {
		this.trigger('showWork', [num]);
		// this.curWorkNum = num;
	}
	showNextWork() {
		this.trigger('showNextWork');
	}
	showPrevWork() {
		this.trigger('showPrevWork');
	}
}

export let appModel = new AppModel();
