precision mediump float;

uniform float uTrans;
uniform float uTime;
uniform float uAnimateIn;
uniform float uAnimateOut;

varying float vPositionZ;
varying float vScale;
varying vec3 vColor;
varying vec3 vColor2;
varying vec2 vUv;
varying float vTrans;
varying float vCustomUv;

void main(){
	float trans = vTrans; 
	vec3 color =  mix(mix(vColor, vColor2, vPositionZ), vec3(1.0), trans);
	float colorAlpha = mix(0.95, 1.0, vTrans);
    // gl_FragColor = vec4( color, colorAlpha);
    float rate = 0.5 * (cos(uTime - 6.28 * vCustomUv) + 1.);
    color = mix( vec3(1.0), vec3(color), 1.0 - rate);
    gl_FragColor = vec4( color, (1.0 - rate) * uAnimateOut );
}