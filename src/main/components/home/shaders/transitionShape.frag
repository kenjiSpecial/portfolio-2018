precision mediump float;

#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif

uniform float uTrans;
uniform float uRollOver;
uniform float uRollOut;
uniform bool uAnimateIn;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;

float sineIn(float t) {
return sin((t - 1.0) * HALF_PI) + 1.0;
}

float sineOut(float t) {
return sin(t * HALF_PI);
}

float cubicOut(float t) {
	float f = t - 1.0;
	return f * f * f + 1.0;
  }

void main(){
	float trans;
	if(uAnimateIn) trans = sineIn(vTrans);
	else trans = cubicOut(vTrans);
	vec3 color =  mix(mix(vColor, vColor2, vPositionZ), vec3(1.0), trans);
	// float colorAlpha = mix(0.0, 1.0, clamp( vTrans, 0.99, 1.0));
	float colorAlpha = mix(0.95, 1.0, vTrans) * clamp(3.0 * uRollOver - 2. * vUv.x, 0.0, 1.0) * uRollOut;
    gl_FragColor = vec4( color, colorAlpha);
}