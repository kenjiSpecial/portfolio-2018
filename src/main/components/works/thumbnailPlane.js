const EventEmitter = require('wolfy87-eventemitter');
import { mat4 } from 'gl-matrix/src/gl-matrix';
import {
	textureBaseShaderFragSrc,
	uvBaseShaderVertSrc,
	wireFrameFragSrc,
	baseShaderVertSrc,
	shaderVertSrc
} from './shaders/base.shader';
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
import { Quint, Power2, TweenLite } from 'gsap';
import { randomFloat, clamp } from 'tubugl-utils/src/mathUtils';
import { appModel } from '../model/appModel';

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

		this._resetTransRate();

		this._uRand0 = randomFloat(-300, 300);
		this._uRand1 = randomFloat(-300, 300);

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = !!params.isDepthTest;
		this._isTransparent = !!params.isTransparent;

		this._makeProgram(params);
		this._makeBuffer();

		if (this._isWire) {
			this._makeWireframe();
			this._makeWireframeBuffer();
		}
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
		this._program = new Program(this._gl, uvBaseShaderVertSrc, textureBaseShaderFragSrc);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
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

	_makeWireframeBuffer() {
		this._wireframeIndexBuffer = new IndexArrayBuffer(
			this._gl,
			generateWireframeIndices(this._indexBuffer.dataArray)
		);
		this._wireframeIndexCnt = this._wireframeIndexBuffer.dataArray.length;
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

	render(camera, mouse) {
		if (this._transInRate == 0.0 || this._transOutRate == 1.0) return;
		this.update(camera, mouse).draw();
		if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera, mouse) {
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
		// this._gl.uniform1f(this._program.getUniforms('uAlpha').location, this.alpha);
		this._gl.uniform1f(this._program.getUniforms('uSide').location, this._width);
		this._gl.uniform1f(this._program.getUniforms('uTransIn').location, this._transInRate);
		this._gl.uniform1f(this._program.getUniforms('uTransOut').location, this._transOutRate);
		this._gl.uniform2f(this._program.getUniforms('uMouse').location, mouse.x, mouse.y);
		this._gl.uniform1f(this._program.getUniforms('uRandY0').location, this._uRand0);
		this._gl.uniform1f(this._program.getUniforms('uRandY1').location, this._uRand1);
		this._texture.activeTexture().bind();
		return this;
	}

	_resetTransRate() {
		if (this.id === (appModel.curWorkNum + 2) % 3) {
			this._transInRate = 1.0;
			this._transOutRate = 1.0;
		} else {
			this._transInRate = 0;
			this._transOutRate = 0;
		}
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

	resize() {}

	addGui(gui) {
		let positionFolder = gui.addFolder('position');
		positionFolder.add(this.position, 'x', -200, 200);
		positionFolder.add(this.position, 'y', -200, 200);
		positionFolder.add(this.position, 'z', -200, 200);

		let scaleFolder = gui.addFolder('scale');
		scaleFolder.add(this.scale, 'x', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'y', 0.05, 2).step(0.01);
		scaleFolder.add(this.scale, 'z', 0.05, 2).step(0.01);

		let rotationFolder = gui.addFolder('rotation');
		rotationFolder.add(this.rotation, 'x', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'y', -Math.PI, Math.PI).step(0.01);
		rotationFolder.add(this.rotation, 'z', -Math.PI, Math.PI).step(0.01);

		gui
			.add(this, '_isWire')
			.name('isWire')
			.onChange(() => {
				if (this._isWire && !this._wireframeProgram) {
					this._makeWireframe();
					this._makeWireframeBuffer();
				}
			});
	}

	updateRandom() {
		this._uRand0 = randomFloat(150, 300);
		this._uRand1 = randomFloat(150, 300);
		if (Math.random() < 0.5) this._uRand0 *= -1;
		if (Math.random() < 0.5) this._uRand1 *= -1;
	}

	animateIn() {
		this._transOutRate = 0;
		TweenMax.fromTo(
			this,
			1.2,
			{ _transInRate: 0 },
			{ _transInRate: 1, ease: Power2.easeInOut }
		);
	}

	animateOut() {
		this._transInRate = 1;
		TweenMax.fromTo(
			this,
			1.2,
			{ _transOutRate: 0 },
			{ _transOutRate: 1, ease: Power2.easeInOut }
		);
	}

	mouseMove(value) {
		if (value > 0 && this.id === appModel.curWorkNum) {
			console.log(this.id);
			this._transInRate = clamp(1 - value, 0.0, 1.0);
		} else if (value < 0 && this.id === appModel.curWorkNum) {
			this._transOutRate = clamp(-value, 0.0, 1.0);
		}

		if (this.id === (appModel.curWorkNum + 1) % 3 && value < 0) {
			this._transOutRate = 0.0;
			this._transInRate = clamp(-value, 0.0, 1.0);
		}

		if (this.id === (appModel.curWorkNum + 2) % 3 && value > 0) {
			this._transInRate = 1.0;
			this._transOutRate = clamp(1.0 - value, 0.0, 1.0);
		}
	}

	mouseUp(value) {
		if (this.id === appModel.curWorkNum) {
			TweenMax.to(this, 0.4, {
				_transInRate: 1,
				_transOutRate: 0,
				onComplete: () => {
					this.updateRandom();
				}
			});
		} else if (this.id === (appModel.curWorkNum + 1) % 3) {
			TweenMax.to(this, 0.4, { _transInRate: 0, _transOutRate: 0 });
		} else {
			TweenMax.to(this, 0.4, { _transInRate: 1, _transOutRate: 1 });
		}
	}

	forceLeft() {
		this._transInRate = 1;
		this._transOutRate = 1;
	}

	forceRight() {
		this._transInRate = 0;
		this._transOutRate = 0;
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
