import { randomFloat } from 'tubugl-utils/src/mathUtils';
import {
	CULL_FACE,
	BACK,
	DEPTH_TEST,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	BLEND,
	TRIANGLES,
	UNSIGNED_SHORT
} from 'tubugl-constants';
import { ArrayBuffer } from 'tubugl-core/src/arrayBuffer';
import { IndexArrayBuffer } from 'tubugl-core/src/indexArrayBuffer';
import { Program } from 'tubugl-core/src/program';

const TweenLite = require('gsap/TweenLite');
const EventEmitter = require('wolfy87-eventemitter');
const vertSrc = `
precision mediump float;

attribute vec4 position;
attribute vec3 color;
attribute vec3 color2;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float uTime;
uniform float uTrans;
uniform vec2 uMouse;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;


  float cubicOut(float t) {
	float f = t - 1.0;
	return f * f * f + 1.0;
  }

  #ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

float sineOut(float t) {
  return sin(t * HALF_PI);
}
float qinticInOut(float t) {
	return t < 0.5
	  ? +16.0 * pow(t, 5.0)
	  : -0.5 * pow(2.0 * t - 2.0, 5.0) + 1.0;
  } 
void main(){
	vPositionZ = clamp( (sin(10.0* uTime) + 1.0) * 0.5, 0.0, 1.0);

	gl_Position = projectionMatrix * viewMatrix * modelMatrix *  ( vec4( position.xy , position.z  , 1.0));

	vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
	float dis = length(dMouse);
	float scale =(1.0 - clamp( dis , 0.0, 1.0)) * 0.04;// clamp( 2.0 * length(uMouse) , 0.12, 1.0);
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
	gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
	float uvX = cubicOut(uv.x);
	float uvY =  cubicOut(uv.y) ; //bounceOut(uv.y);
	float trans = clamp(uTrans * 3.8 - 2.0 * uvX - 0.8 * uvY, 0.0, 1.0);
	gl_Position.x = mix(gl_Position.x, (2. * uv.x - 1.0) * gl_Position.w, trans);
	gl_Position.y = mix(gl_Position.y, (2. * -uv.y + 1.0) * gl_Position.w, trans);
	gl_Position.z = mix(gl_Position.z, -0.9 * gl_Position.w, trans);
	
	vPositionZ =  vPositionZ * (scale * 1.  + 1.0);

	vColor = color;
	vColor2 = color2;
	vUv = uv;
	vTrans= trans;
}
`;
const fragSrc = `
precision mediump float;

#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

uniform float uTrans;
uniform float uRollOver;
uniform float uRollOut;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;

float sineIn(float t) {
return sin((t - 1.0) * HALF_PI) + 1.0;
}
  
void main(){
    vec3 color =  mix(mix(vColor, vColor2, vPositionZ), vec3(1.0),sineIn(vTrans));
	float colorAlpha = mix(0.0, 1.0, clamp( vTrans, 0.9, 1.0));
	colorAlpha = colorAlpha * clamp(3.0 * uRollOver - 2. * vUv.x, 0.0, 1.0) * uRollOut;
    gl_FragColor = vec4(color, colorAlpha);
}
`;

export class TransitionShape extends EventEmitter {
	/**
	 *
	 * @param {webglContext} gl
	 * @param {name: string} params
	 * @param {number} x
	 * @param {number} y
	 * @param {number} width
	 * @param {number} height
	 */
	constructor(gl, params = { name: 'about' }, x = 0, y = 16, width = 200, height = 60) {
		super();
		this._gl = gl;

		this._isDesktop = true;
		this._isTrans = false;
		this._isRollover = false;

		this._x = x;
		this._y = y;
		this._width = width;
		this._height = height;
		this._side = 'double';
		this._transRate = 0;
		this._rollOverRate = 0;
		this._rollOutRate = 1;

		this.name = params.name;

		let pts = [];
		let uvs = [];
		let colors = [];
		let color2s = [];
		let indices = [];
		this._makeProgram();

		let scale = 0.2;
		let xNum = 10;
		let startX = 35;
		let lineHeight = 8 * scale;

		let xx = -startX - startX / (xNum + 1) + randomFloat(-1, 1);
		let yy = lineHeight + this._y;
		let zz = randomFloat(10, 20);
		let rad;

		for (let ii = -xNum; ii <= xNum; ii++) {
			xx += startX / (xNum + 1) + randomFloat(-1, 1);
			yy += randomFloat(-0.3, 0.3);

			if (ii === -xNum) xx = -startX;
			else if (ii == xNum) xx = startX;

			pts.push(xx, yy, zz);
			pts.push(xx, yy - lineHeight * 2, zz);
			uvs.push((ii + xNum) / (2 * xNum), 0);
			uvs.push((ii + xNum) / (2 * xNum), 1);

			rad = randomFloat(0.8, 1.2);
			colors.push(rad * 0.4, rad * 0.4, rad);
			rad = randomFloat(0.8, 1.2);
			colors.push(rad * 0.4, rad * 0.4, rad);
			rad = randomFloat(0.8, 1.0);
			color2s.push(rad * 0.4, rad * 0.4, rad);
			rad = randomFloat(0.8, 1.0);
			color2s.push(rad * 0.4, rad * 0.4, rad);
		}

		for (let ii = 0; ii < xNum * 2; ii++) {
			indices.push(2 * ii);
			indices.push(2 * ii + 1);
			indices.push(2 * ii + 2);

			indices.push(2 * ii + 1);
			indices.push(2 * ii + 3);
			indices.push(2 * ii + 2);
		}

		this._positionBuffer = new ArrayBuffer(this._gl, new Float32Array(pts));
		this._positionBuffer.setAttribs('position', 3);
		this._uvBuffer = new ArrayBuffer(this._gl, new Float32Array(uvs));
		this._uvBuffer.setAttribs('uv', 2);
		this._colorBuffer = new ArrayBuffer(this._gl, new Float32Array(colors));
		this._colorBuffer.setAttribs('color', 3);
		this._color2Buffer = new ArrayBuffer(this._gl, new Float32Array(color2s));
		this._color2Buffer.setAttribs('color2', 3);

		this._indexBuffer = new IndexArrayBuffer(this._gl, new Uint16Array(indices));

		this._cnt = indices.length;
	}

	render(camera, modelMatrix, introRate, mouse, time) {
		this.update(camera, modelMatrix, introRate, mouse, time).draw();
	}
	update(camera, modelMatrix, introRate, mouse, time) {
		if (this._isDesktop) this._checkRollover(mouse);
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
		this._gl.uniform1f(this._program.getUniforms('uRollOver').location, this._rollOverRate);
		this._gl.uniform1f(this._program.getUniforms('uRollOut').location, this._rollOutRate);

		return this;
	}
	testAbout() {
		console.log('testAbout');
		TweenLite.fromTo(this, 1.8, { _transRate: 0 }, { _transRate: 1 });
	}
	draw() {
		this._gl.enable(CULL_FACE);
		this._gl.cullFace(BACK);

		this._gl.enable(DEPTH_TEST);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		this._gl.enable(BLEND);

		this._gl.drawElements(TRIANGLES, this._cnt, UNSIGNED_SHORT, 0);

		return this;
	}
	setInteractiveArea(xx, yy, width, height) {
		this._glInteractiveArea = {
			x: xx,
			y: yy,
			width: width,
			height: height
		};
	}
	resize(windowWidth, windowHeight) {
		this._area = {
			left: this._glInteractiveArea.x - this._glInteractiveArea.width / 2 + windowWidth / 2,
			right: this._glInteractiveArea.x + this._glInteractiveArea.width / 2 + windowWidth / 2,
			top: this._glInteractiveArea.y - this._glInteractiveArea.height / 2 + windowHeight / 2,
			bottom:
				this._glInteractiveArea.y + this._glInteractiveArea.height / 2 + windowHeight / 2
		};
	}
	_checkRollover(mouse) {
		if (this._isTrans) return;

		let prevRollover = this._isRollover;
		if (
			this._area.left < mouse.windowX &&
			this._area.right > mouse.windowX &&
			this._area.top < mouse.windowY &&
			this._area.bottom > mouse.windowY
		) {
			this._isRollover = true;
		} else {
			this._isRollover = false;
		}

		if (this._isRollover && !prevRollover) {
			TweenLite.killTweensOf([this._rollOverRate, this._rollOutRate]);
			if (this._rollOutRate == 1.0) {
				TweenLite.fromTo(
					this,
					0.6,
					{ _rollOverRate: 0 },
					{
						_rollOverRate: 1.0
						// ease: Quint.easeOut
					}
				);
			} else {
				TweenLite.to(this, 0.3, {
					_rollOutRate: 1.0
				});
				TweenLite.fromTo(
					this,
					0.6,
					{
						_rollOverRate: 0.0
					},
					{
						_rollOverRate: 1.0
						// ease: Quint.easeOut
					}
				);
			}
		} else if (!this._isRollover && prevRollover) {
			TweenLite.to(this, 0.6, {
				_rollOutRate: 0.0
			});
		}
	}

	_updateAttributes() {
		if (this._vao) {
			this._vao.bind();
		} else {
			this._positionBuffer.bind().attribPointer(this._program);
			this._colorBuffer.bind().attribPointer(this._program);
			this._color2Buffer.bind().attribPointer(this._program);
			this._uvBuffer.bind().attribPointer(this._program);
			this._indexBuffer.bind();
		}
	}

	_makeProgram() {
		this._program = new Program(this._gl, vertSrc, fragSrc);
	}
	click() {
		if (this._isTrans) return;
		if (this._isRollover) {
			this._isTrans = true;
			TweenLite.to(this, 1.2, { _transRate: 1 });
		}
	}
}
