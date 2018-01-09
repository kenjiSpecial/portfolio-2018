precision mediump float;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
varying float vAlpha;
varying vec2 vPos;

uniform bool uRollover;
uniform float uRolloverTrans;
uniform float uRolloutTrans;  

void main() {
	if(vAlpha < 0.001) discard;
	vec3 color =   mix( vColor2 , vColor, (vPositionZ * 2. - 0.5) );
	
	gl_FragColor = vec4(color, vAlpha);

}