import { randomFloat } from 'tubugl-utils/src/mathUtils';
import {
	CULL_FACE,
	BACK,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	BLEND,
	TRIANGLES
} from 'tubugl-constants';
import { ArrayBuffer } from 'tubugl-core/src/arrayBuffer';
import { Program } from 'tubugl-core/src/program';
import { appModel } from '../model/appModel';

const EventEmitter = require('wolfy87-eventemitter');
const vertSrc = require('./shaders/loader.vert');
const fragSrc = require('./shaders/loader.frag');

export class Loader extends EventEmitter {
	/**
	 *
	 * @param {webglContext} gl
	 * @param {name: string} params
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(gl, params = {}) {
		super();
		appModel.addListener('image:loaded', this.animateOut.bind(this));
		this._gl = gl;

		this._isDesktop = true;
		this._isRollover = false;
		this._isAnimateIn = true;

		this._side = 'double';
		this._transRate = 0;
		this._animateInRate = 0;
		this.animateOutRate = 1;
		this._time = 1.57;
		// this._rollOverRate = 0;
		// this._rollOutRate = 1;

		this.name = params.name;

		let pts = [];
		let uvs = [];
		let colors = [];
		let color2s = [];
		let indices = [];
		this._makeProgram();

		let xNum = 10;
		let startX = 35;
		let lineHeight = 1;

		let xx = -startX - startX / (xNum + 1) + randomFloat(-1, 1);
		let yy = lineHeight;
		let zz = randomFloat(10, 20);
		let rad;

		for (let ii = -xNum; ii <= xNum; ii++) {
			xx += startX / (xNum + 1) + randomFloat(-1, 1);
			yy += randomFloat(-0.3, 0.3);

			if (ii === -xNum) xx = -startX;
			// else if (ii == xNum) xx = startX;

			pts.push(xx, yy, zz);
			pts.push(xx, yy - lineHeight * 2, zz);
			let uvX = (ii + xNum) / (2 * xNum);
			uvs.push(uvX, 0);
			uvs.push(uvX, 1);

			rad = randomFloat(0.9, 1.0);
			colors.push(rad * 0.4, rad * 0.4, rad);
			rad = randomFloat(0.9, 1.0);
			colors.push(rad * 0.4, rad * 0.4, rad);
			rad = randomFloat(0.8, 1.0);
			color2s.push(rad * 0.5, rad * 0.5, rad);
			rad = randomFloat(0.8, 1.0);
			color2s.push(rad * 0.5, rad * 0.5, rad);
		}

		for (let ii = 0; ii < xNum * 2; ii++) {
			indices.push(2 * ii);
			indices.push(2 * ii + 1);
			indices.push(2 * ii + 2);

			indices.push(2 * ii + 1);
			indices.push(2 * ii + 3);
			indices.push(2 * ii + 2);
		}

		let customUvs = [];
		let newPts = [];
		let newUvs = [];
		let newColors = [];
		let newColor2s = [];

		for (let ii = 0; ii < indices.length / 3; ii++) {
			let index0 = indices[3 * ii];
			let index1 = indices[3 * ii + 1];
			let index2 = indices[3 * ii + 2];

			newPts.push(pts[3 * index0], pts[3 * index0 + 1], pts[3 * index0 + 2]);
			newPts.push(pts[3 * index1], pts[3 * index1 + 1], pts[3 * index1 + 2]);
			newPts.push(pts[3 * index2], pts[3 * index2 + 1], pts[3 * index2 + 2]);

			newUvs.push(uvs[2 * index0], uvs[2 * index0 + 1]);
			newUvs.push(uvs[2 * index1], uvs[2 * index1 + 1]);
			newUvs.push(uvs[2 * index2], uvs[2 * index2 + 1]);

			let averageUvX = (uvs[2 * index0] + uvs[2 * index1] + uvs[2 * index2]) / 3;
			customUvs.push(averageUvX);
			customUvs.push(averageUvX);
			customUvs.push(averageUvX);

			newColors.push(colors[3 * index0], colors[3 * index0 + 1], colors[3 * index0 + 2]);
			newColors.push(colors[3 * index1], colors[3 * index1 + 1], colors[3 * index1 + 2]);
			newColors.push(colors[3 * index2], colors[3 * index2 + 1], colors[3 * index2 + 2]);

			newColor2s.push(color2s[3 * index0], color2s[3 * index0 + 1], color2s[3 * index0 + 2]);
			newColor2s.push(color2s[3 * index1], color2s[3 * index1 + 1], color2s[3 * index1 + 2]);
			newColor2s.push(color2s[3 * index2], color2s[3 * index2 + 1], color2s[3 * index2 + 2]);
		}

		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(newPts));
		this._positionBuffer.setAttribs('position', 3);
		this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(newUvs));
		this._uvBuffer.setAttribs('uv', 2);
		this._customUvBuffer = new ArrayBuffer(this._gl, new Float32Array(customUvs));
		this._customUvBuffer.setAttribs('customUv', 1);
		this._colorBuffer = new ArrayBuffer(this._gl, new Float32Array(newColors));
		this._colorBuffer.setAttribs('color', 3);
		this._color2Buffer = new ArrayBuffer(this._gl, new Float32Array(newColor2s));
		this._color2Buffer.setAttribs('color2', 3);

		this._cnt = newPts.length / 3;
	}

	render(camera, modelMatrix, mouse) {
		this._time += 1 / 30;
		this.update(camera, modelMatrix, mouse, this._time).draw();
	}
	update(camera, modelMatrix, mouse, time) {
		this._program.bind();

		this._updateAttributes();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			modelMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		this._gl.uniform2f(this._program.getUniforms('uMouse').location, mouse.x, mouse.y);
		this._gl.uniform1f(this._program.getUniforms('uTime').location, time);
		this._gl.uniform1f(this._program.getUniforms('uTrans').location, this._transRate);
		this._gl.uniform1f(this._program.getUniforms('uAnimateIn').location, this._animateInRate);
		this._gl.uniform1f(this._program.getUniforms('uAnimateOut').location, this.animateOutRate);

		return this;
	}

	draw() {
		// this._gl.clear(this._gl.DEPTH_BUFFER_BIT);
		this._gl.enable(CULL_FACE);
		this._gl.cullFace(BACK);

		this._gl.enable(DEPTH_TEST);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		this._gl.enable(BLEND);

		this._gl.drawArrays(TRIANGLES, 0, this._cnt);

		return this;
	}

	animateIn() {
		TweenMax.fromTo(this, 1.8, { _animateInRate: 0 }, { _animateInRate: 1, delay: 0.5 });
	}

	animateOut() {
		TweenMax.to(this, 0.6, { animateOutRate: 0 });
	}

	resize(windowWidth, windowHeight) {}

	_updateAttributes() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._colorBuffer.bind().attribPointer(this._program);
			this._color2Buffer.bind().attribPointer(this._program);
			this._uvBuffer.bind().attribPointer(this._program);
			this._customUvBuffer.bind().attribPointer(this._program);
			// this._indexBuffer.bind();
		}
	}

	_makeProgram() {
		this._program = new Program(this._gl, vertSrc, fragSrc);
	}
}
