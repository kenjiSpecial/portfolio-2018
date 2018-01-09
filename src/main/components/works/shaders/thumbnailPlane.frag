precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUv;
varying float vAlpha;
varying float vScale;
void main(){
    // if(vAlpha < 0.001) discard;
    
    gl_FragColor = texture2D(uTexture, vUv);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0),  clamp(1.0 - vScale * 2.0, 0.0, 1.0)) ;
    gl_FragColor.a *= vAlpha  * clamp(vScale /2., 0.0, 1.0);
}