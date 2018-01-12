const EventEmitter = require('wolfy87-eventemitter');
import { mat4 } from 'gl-matrix/src/gl-matrix';

const vertSrc = require('./shaders/thumbnailPlane.vert');
const fragSrc = require('./shaders/thumbnailPlane.frag');

import { Program, ArrayBuffer, IndexArrayBuffer, VAO } from 'tubugl-core';
import {
	CULL_FACE,
	FRONT,
	BACK,
	TRIANGLES,
	UNSIGNED_SHORT,
	LINES,
	BLEND,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	DEPTH_TEST
} from 'tubugl-constants';
import { generateWireframeIndices } from 'tubugl-utils';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';
import { Quint, Power2, TweenLite } from 'gsap/TweenLite';
import { randomFloat, clamp } from 'tubugl-utils/src/mathUtils';
import { appModel } from '../model/appModel';
import { random } from 'gl-matrix/src/gl-matrix/vec2';

export class ThumbnailPlane extends EventEmitter {
	constructor(gl, params = {}, width = 100, height = 100, widthSegment = 1, heightSegment = 1) {
		super();

		this.id = params.id;
		this.position = new Vector3();
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this._isGl2 = params.isGl2;
		this._gl = gl;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'
		this._texture = params.texture;

		this._width = width;
		this._height = height;
		this._widthSegment = widthSegment;
		this._heightSegment = heightSegment;
		this._introRate = 0;

		// this._resetTransRate();
		this.updateRandom();

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = !!params.isDepthTest;
		this._isTransparent = !!params.isTransparent;

		this._makeProgram(params);
		this._makeBuffer();
		this.resize();
	}

	setPosition(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.position.x = x;
		if (y !== undefined) this.position.y = y;
		if (z !== undefined) this.position.z = z;

		return this;
	}

	setRotation(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.rotation.x = x;
		if (y !== undefined) this.rotation.y = y;
		if (z !== undefined) this.rotation.z = z;

		return this;
	}

	_makeProgram(params) {
		this._program = new Program(this._gl, vertSrc, fragSrc);
	}

	_makeBuffer() {
		if (this._isGl2) {
			this._vao = new VAO(this._gl);
			this._vao.bind();
		}
		this._positionBuffer = new ArrayBuffer(
			this._gl,
			ThumbnailPlane.getVertices(
				this._width,
				this._height,
				this._widthSegment,
				this._heightSegment
			)
		);
		this._positionBuffer.setAttribs('position', 2);

		if (this._vao) {
			this._positionBuffer.bind().attribPointer(this._program);
		}

		let indices = ThumbnailPlane.getIndices(this._widthSegment, this._heightSegment);
		this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		this._uvBuffer = new ArrayBuffer(
			this._gl,
			ThumbnailPlane.getUvs(this._widthSegment, this._heightSegment)
		);
		this._uvBuffer.setAttribs('uv', 2);

		this._cnt = indices.length;
	}

	_updateAttributres() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._uvBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();
		}
	}

	render(camera, mouse, totalSlideRate, thumbnailLength, yScale) {
		let curValue = totalSlideRate - this.id;
		let rate = curValue - Math.floor(curValue / thumbnailLength) * thumbnailLength;
		if (rate < thumbnailLength && rate > thumbnailLength - 1) rate = rate - thumbnailLength;
		this._transRate = rate;

		this.update(camera, mouse, yScale).draw();
		if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera, mouse, yScale) {
		this._updateModelMatrix();

		this._program.bind();

		this._updateAttributres();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
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
		this._program.setUniformTexture(this._texture, 'uTexture');
		this._gl.uniform1f(this._program.getUniforms('uSide').location, this._width);
		this._gl.uniform1f(this._program.getUniforms('uTrans').location, this._transRate);
		this._gl.uniform2f(this._program.getUniforms('uMouse').location, mouse.x, mouse.y);
		this._gl.uniform1f(this._program.getUniforms('uRandY0').location, this._uRand0);
		this._gl.uniform1f(this._program.getUniforms('uRandY1').location, this._uRand1);
		this._gl.uniform1f(this._program.getUniforms('uWindowRate').location, this._uWindowRate);
		this._gl.uniform1f(this._program.getUniforms('uIntro').location, this._introRate);
		this._gl.uniform1f(this._program.getUniforms('uYScale').location, yScale);

		this._texture.activeTexture().bind();
		return this;
	}

	_resetTransRate() {
		this._transRate = 9999;
	}

	reset() {
		this._introRate = 0;
	}

	updateWire(camera) {
		let prg = this._wireframeProgram;

		prg.bind();
		this._positionBuffer.bind().attribPointer(prg);
		this._wireframeIndexBuffer.bind();

		this._gl.uniformMatrix4fv(
			prg.getUniforms('modelMatrix').location,
			false,
			this._modelMatrix
		);
		this._gl.uniformMatrix4fv(prg.getUniforms('viewMatrix').location, false, camera.viewMatrix);
		this._gl.uniformMatrix4fv(
			prg.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);

		return this;
	}

	draw() {
		if (this._side === 'double') {
			this._gl.disable(CULL_FACE);
		} else if (this._side === 'front') {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(BACK);
		} else {
			this._gl.enable(CULL_FACE);
			this._gl.cullFace(FRONT);
		}
		this._gl.enable(DEPTH_TEST);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		this._gl.enable(BLEND);

		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}

	drawWireframe() {
		this._gl.drawElements(LINES, this._wireframeIndexCnt, UNSIGNED_SHORT, 0);

		return;
	}

	resize() {
		// console.log(window.innerWidth, window.innerHeight);
		this._uWindowRate = window.innerWidth / window.innerHeight;
		// console.log(this._uWindowRate);

		let minSide = Math.min(window.innerWidth, window.innerHeight);
		let scale = Math.min(minSide / 720, 1.0);

		// mat4.fromScaling(this._modelMatrix, [scale, scale, 1]);
		this.scale.x = scale;
		this.scale.y = scale;
		// console.log(this.scale);
		// scale;
	}

	addGui(gui) {}

	updateRandom() {
		if (this.id % 2 == 0) this._uRand0 = -randomFloat(100, 300);
		else this._uRand0 = randomFloat(100, 300);

		this._uRand1 = this._uRand0;
	}

	animateIn() {
		TweenLite.fromTo(
			this,
			1.2,
			{ _introRate: 1 },
			{ _introRate: 0, ease: Power2.easeInOut, delay: 0.2 }
		);
	}

	animateOut() {
		TweenLite.to(this, 1.0, { _introRate: 1, ease: Power2.easeInOut });
	}

	mouseMove(value, totalLength) {
		// console.log(value, totalLength);
	}

	mouseUp(value = 0.4) {
		// value = 10;
		// TweenLite.killTweensOf([this._transInRate, this._transOutRate]);
		// if (this.id === appModel.curWorkNum) {
		// 	TweenLite.to(this, value, {
		// 		_transInRate: 1,
		// 		_transOutRate: 0,
		// 		onComplete: () => {
		// 			this.updateRandom();
		// 		}
		// 	});
		// } else if (this.id === (appModel.curWorkNum + 1) % 3) {
		// 	TweenLite.to(this, value, { _transInRate: 0, _transOutRate: 0 });
		// } else {
		// 	TweenLite.to(this, value, { _transInRate: 1, _transOutRate: 1 });
		// }
	}

	_updateModelMatrix() {
		if (
			!this._isNeedUpdate &&
			!this.position.needsUpdate &&
			!this.rotation.needsMatrixUpdate &&
			!this.scale.needsUpdate
		)
			return;

		mat4.fromTranslation(this._modelMatrix, this.position.array);
		mat4.scale(this._modelMatrix, this._modelMatrix, this.scale.array);

		this.rotation.updateMatrix();
		mat4.multiply(this._modelMatrix, this._modelMatrix, this.rotation.matrix);

		this._isNeedUpdate = false;
		this.position.needsUpdate = false;
		this.scale.needsUpdate = false;

		return this;
	}

	static getVertices(width, height, widthSegment, heightSegment) {
		let vertices = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		// set vertices and barycentric vertices
		for (let yy = 0; yy <= heightSegment; yy++) {
			let yPos = (-0.5 + yRate * yy) * height;

			for (let xx = 0; xx <= widthSegment; xx++) {
				let xPos = (-0.5 + xRate * xx) * width;
				vertices.push(xPos);
				vertices.push(yPos);
			}
		}
		vertices = new Float32Array(vertices);

		return vertices;
	}

	static getIndices(widthSegment, heightSegment) {
		let indices = [];

		for (let yy = 0; yy < heightSegment; yy++) {
			for (let xx = 0; xx < widthSegment; xx++) {
				let rowStartNum = yy * (widthSegment + 1);
				let nextRowStartNum = (yy + 1) * (widthSegment + 1);

				indices.push(rowStartNum + xx);
				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);

				indices.push(rowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx + 1);
				indices.push(nextRowStartNum + xx);
			}
		}

		indices = new Uint16Array(indices);

		return indices;
	}

	static getUvs(widthSegment, heightSegment) {
		let uvs = [];
		let xRate = 1 / widthSegment;
		let yRate = 1 / heightSegment;

		for (let yy = 0; yy <= heightSegment; yy++) {
			let uvY = 1.0 - yRate * yy;
			for (let xx = 0; xx <= widthSegment; xx++) {
				let uvX = xRate * xx;

				uvs.push(uvX);
				uvs.push(uvY);
			}
		}

		uvs = new Float32Array(uvs);

		return uvs;
	}
}
