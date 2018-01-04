const EventEmitter = require('wolfy87-eventemitter');
const Delaunator = require('delaunator');
import { mat4 } from 'gl-matrix/src/gl-matrix';
import { wireFrameFragSrc } from './shaders/base.shader';
import { Program, ArrayBuffer, IndexArrayBuffer, VAO } from 'tubugl-core';
import {
	CULL_FACE,
	FRONT,
	BACK,
	TRIANGLES,
	UNSIGNED_SHORT,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE,
	ZERO,
	BLEND,
	LINES,
	UNSIGNED_INT
} from 'tubugl-constants';
import { generateWireframeIndices } from 'tubugl-utils';
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';

import { randomFloat, mix, clamp } from 'tubugl-utils/src/mathUtils';
import { testPoints } from './textData';

const baseShaderVertSrc = `
attribute vec4 position;
attribute vec3 theta;
attribute vec2 thetaVel;
attribute vec3 color;
attribute vec3 color2;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
void main() {
	vColor = color;
	vColor2 = color2;
    vPositionZ = clamp(( (sin(theta.x + 3.0 * uTime * thetaVel.x) + 1.0)) * 0.5, 0.0, 1.0);
	float rad = position.z;
	float theta = position.x;
	float phi = position.y;
	vec4 outpos = vec4( rad * cos(phi) * sin(theta), rad * sin(phi), rad * cos(phi) * cos(theta), 1.0);
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * outpos;
	// gl_Position = projectionMatrix * viewMatrix * modelMatrix * ( vec4(position.xy, position.z * 3.0, 1.0));
}`;

export const baseShaderFragSrc = `
precision mediump float;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;

void main() {
    vec3 color =  mix(vColor2, vColor, vPositionZ * 2. - 0.5);
    
    gl_FragColor = vec4(color, 1.0);

}`;

export class Plane extends EventEmitter {
	constructor(gl, width = 100, height = 100, widthSegment = 1, heightSegment = 1, params = {}) {
		super();

		this.position = new Vector3();
		// this.position.x = -200;
		// this.position.y = -100;
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this._isGl2 = params.isGl2;
		this._gl = gl;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'

		this._width = width;
		this._height = height;
		this._widthSegment = widthSegment;
		this._heightSegment = heightSegment;

		this._modelMatrix = mat4.create();
		this._isNeedUpdate = true;
		this._isWire = !!params.isWire;
		this._isDepthTest = true;
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
		const fragmentShaderSrc = baseShaderFragSrc;
		const vertexShaderSrc = baseShaderVertSrc;

		this._program = new Program(this._gl, vertexShaderSrc, fragmentShaderSrc);
	}

	_makeWireframe() {
		this._wireframeProgram = new Program(this._gl, baseShaderVertSrc, wireFrameFragSrc);
	}

	_makeBuffer() {
		if (this._isGl2) {
			this._vao = new VAO(this._gl);
			this._vao.bind();
		}

		let points = [];
		let colors = [];
		let color2s = [];
		let indexNum = 0;
		let indicesColor = {};

		for (var xx = -10; xx <= 10; xx++) {
			for (var yy = -10; yy <= 10; yy++) {
				points.push([xx * 30 + randomFloat(-15, 15), yy * 30 + randomFloat(-15, 15)]);
				var rand2 = randomFloat(0, 0.4) + 0.6;
				var rand = randomFloat(0, 0.2) + 0.8;
				color2s.push(rand2, rand2, rand2);
				colors.push(rand, rand, rand);
				indicesColor[indexNum++] = 'normal';
			}
		}

		for (var ii = 0; ii < testPoints.length; ii++) {
			points.push([
				testPoints[ii][0] + randomFloat(-1, 1),
				testPoints[ii][1] + randomFloat(-1, 1)
			]);
			colors.push(0.3, 0.4, 0.6);
			var rand = randomFloat(0, 0.1) + 0.8;
			color2s.push(rand, rand, rand);

			indicesColor[indexNum++] = 'about';
		}

		var delaunay = new Delaunator(points);
		let coords = new Float32Array(delaunay.coords.length * 1.5);
		let thetaVelocityArr = new Float32Array(delaunay.coords.length);
		let thetaArr = new Float32Array(delaunay.coords.length * 1.5);

		for (var ii = 0; ii < delaunay.coords.length / 2; ii++) {
			coords[3 * ii] = delaunay.coords[2 * ii] / (30 * 20) * 2 * Math.PI;
			coords[3 * ii + 1] = delaunay.coords[2 * ii + 1] / (30 * 20) * Math.PI;
			coords[3 * ii + 2] = randomFloat(800, 1200);

			thetaVelocityArr[2 * ii] = randomFloat(0, 2 * Math.PI);
			thetaVelocityArr[2 * ii + 1] = randomFloat(0, 2 * Math.PI);

			thetaArr[3 * ii] = randomFloat(0, 2 * Math.PI);
			thetaArr[3 * ii + 1] = randomFloat(0, 2 * Math.PI);
			thetaArr[3 * ii + 2] = randomFloat(0, 2);
		}

		let updatedCoords = [],
			updatedThetaArr = [],
			updatedColors = [],
			updatedColor2s = [],
			updatedThetaVelocityArr = [];
		let indices = delaunay.triangles;
		console.log(indices);
		for (let ii = 0; ii < indices.length; ii++) {
			let index = indices[ii];
			updatedCoords.push(coords[3 * index], coords[3 * index + 1], coords[3 * index + 2]);
			updatedThetaArr.push(
				thetaArr[3 * index],
				thetaArr[3 * index + 1],
				thetaArr[3 * index + 2]
			);

			updatedThetaVelocityArr.push(
				thetaVelocityArr[2 * index],
				thetaVelocityArr[2 * index + 1]
			);
		}

		for (let ii = 0; ii < indices.length; ii += 3) {
			if (
				indicesColor[indices[ii]] == 'about' &&
				indicesColor[indices[ii + 1]] == 'about' &&
				indicesColor[indices[ii + 2]] == 'about'
			) {
				let x0 = coords[3 * indices[ii]];
				let y0 = coords[3 * indices[ii] + 1];
				let x1 = coords[3 * indices[ii + 1]];
				let y1 = coords[3 * indices[ii + 1] + 1];
				let x2 = coords[3 * indices[ii + 2]];
				let y2 = coords[3 * indices[ii + 2] + 1];
				let dX01 = x0 - x1;
				let dY01 = y0 - y1;
				let side0 = Math.sqrt(dX01 * dX01 + dY01 * dY01);
				let dX12 = x1 - x2;
				let dY12 = y1 - y2;
				let side1 = Math.sqrt(dX12 * dX12 + dY12 * dY12);
				let dX20 = x2 - x0;
				let dY20 = y2 - y0;
				let side2 = Math.sqrt(dX20 * dX20 + dY20 * dY20);

				let sp = (side0 + side1 + side2) / 2;
				let area = Math.sqrt(sp * (sp - side0) * (sp - side1) * (sp - side2));

				console.log(area);
				let mixRate = 1.0 - clamp(area * 10000.0, 0.0, 1.0);

				for (let kk = 0; kk < 3; kk++) {
					var rand = randomFloat(0, 0.1) + 0.8;
					var rand2 = randomFloat(0, 0.2) + 0.8;
					let colorRate = mix(1.0, 0.3, mixRate);
					let blue1 = mix(rand, 1.0, mixRate);
					let blue2 = mix(rand2, 1.0, mixRate);
					updatedColors.push(rand * colorRate, rand * colorRate, blue1);
					updatedColor2s.push(rand2, rand2, blue2);
					// } else {
					// updatedColors.push(rand, rand, rand);
					// updatedColor2s.push(rand, rand, rand);
					// }

					// updatedColor2s.push(rand, rand, rand);
				}
			} else {
				for (let kk = 0; kk < 3; kk++) {
					var rand = randomFloat(0, 0.1) + 0.8;
					updatedColors.push(rand, rand, rand);
					var rand = randomFloat(0, 0.2) + 0.7;
					updatedColor2s.push(rand, rand, rand);
				}
			}
		}
		console.log(updatedColor2s.length);
		console.log(updatedCoords.length);

		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(updatedCoords));
		this._positionBuffer.setAttribs('position', 3);

		this._thetaBuffer = new ArrayBuffer(this._gl, new Float32Array(updatedThetaArr));
		this._thetaBuffer.setAttribs('theta', 3);

		this._colorBuffer = new ArrayBuffer(this._gl, new Float32Array(updatedColors));
		this._colorBuffer.setAttribs('color', 3);

		this._color2Buffer = new ArrayBuffer(this._gl, new Float32Array(updatedColor2s));
		this._color2Buffer.setAttribs('color2', 3);

		this._thetaVelocityBuffer = new ArrayBuffer(
			this._gl,
			new Float32Array(updatedThetaVelocityArr)
		);
		this._thetaVelocityBuffer.setAttribs('thetaVel', 2);

		if (this._vao) {
			this._positionBuffer.bind().attribPointer(this._program);
		}

		// console.log(delaunay);
		//Plane.getIndices(this._widthSegment, this._heightSegment);
		// console.log(delaunay);
		// this._indexBuffer = new IndexArrayBuffer(this._gl, indices);

		// this._cnt = indices.length;
		this._cnt = this._positionBuffer.dataArray.length / 3;
	}

	_makeWireframeBuffer() {
		this._wireframeIndexBuffer = new IndexArrayBuffer(
			this._gl,
			generateWireframeIndices(this._indexBuffer.dataArray, false)
		);
		this._wireframeIndexCnt = this._wireframeIndexBuffer.dataArray.length;
	}

	_updateAttributres() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._thetaVelocityBuffer.bind().attribPointer(this._program);
			this._thetaBuffer.bind().attribPointer(this._program);
			this._colorBuffer.bind().attribPointer(this._program);
			this._color2Buffer.bind().attribPointer(this._program);
			// this._indexBuffer.bind();
		}
	}

	render(camera) {
		this.update(camera).draw();
		if (this._isWire) this.updateWire(camera).drawWireframe();
	}

	update(camera) {
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

		if (!this._time) this._time = 1 / 60;
		else this._time += 1 / 500;

		this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);

		return this;
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

		if (this._isDepthTest) this._gl.enable(DEPTH_TEST);
		else this._gl.disable(DEPTH_TEST);

		if (this._isTransparent) {
			this._gl.blendFunc(SRC_ALPHA, ONE);
			this._gl.enable(BLEND);
		} else {
			this._gl.blendFunc(SRC_ALPHA, ZERO);
			this._gl.disable(BLEND);
		}

		// this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_INT, 0);
		// console.log(this._cnt);
		this._gl.drawArrays(TRIANGLES, 0, this._cnt);

		return this;
	}

	drawWireframe() {
		this._gl.drawElements(LINES, this._wireframeIndexCnt, UNSIGNED_INT, 0);

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
}
