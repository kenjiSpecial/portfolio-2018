precision mediump float;

uniform float uTrans;

varying float vPositionZ;
varying vec3 vColor;
varying vec3 vColor2;
varying float vAlpha;
void main() {
	if(vAlpha < 0.001) discard;
    vec3 oColor =  mix(vColor2, vColor, vPositionZ * 2. - 0.5);
    oColor = mix(oColor, vec3(1.0), clamp(1.0 - uTrans, 0.0, 1.0));
    
    gl_FragColor = vec4(oColor, vAlpha);

}   