import { randomFloat } from 'tubugl-utils/src/mathUtils';

export const baseShaderVertSrc = `
attribute vec4 position;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}`;

export function shaderVertSrc() {
	let randY0 = randomFloat(250, 300);
	let randZ0 = randomFloat(250, 300);
	let randY1 = randomFloat(100, 200);
	let randZ1 = randomFloat(100, 200);
	return `
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform vec2 uMouse;
uniform float uSide;
uniform float uTransIn;
uniform float uTransOut;

varying vec2 vUv;
varying float vScale;
void main(){
    float posX = position.x + uSide * (1.0 - uTransIn);
    float posY = position.y - ${randY0} * (1.0 - uTransIn) * uv.x; 
    float posZ = position.z - ${randZ0} * (1.0 - uTransIn) * uv.x;
    
    posX = posX - uTransOut * uSide ;
    posY = posY - ${randY1} * uTransOut * (1.0 - uv.x);
    posZ = posZ - ${randZ1} * uTransOut * (1.0 - uv.x);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix  * vec4(posX, posY, posZ, 1.0);
    vUv = uv;
    
    vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
    float dis = length(dMouse);

    float scale;
    if(dis < 0.02){
        scale = dis/0.02 * 0.12 * max(dis * 2.0, 1.0);    
    }else{
        scale =(1.0 - clamp( dis - 0.02 , 0.0, 1.0)) * 0.12 * max(dis * 2.0, 1.0);
    }
    
    
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
    
    
    vScale = dis;
}
`;
}

export const uvBaseShaderVertSrc = `
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform vec2 uMouse;
uniform float uSide;
uniform float uTransIn;
uniform float uTransOut;
uniform float uRandY0;
uniform float uRandY1;

varying vec2 vUv;
varying float vScale;
varying float vAlpha;

void main(){
    float posX = position.x + uSide * (1.0 - uTransIn);
    float posY = position.y - uRandY0 * (1.0 - uTransIn) * uv.x; 
    float posZ = position.z - 500. * (1.0 - uTransIn) * uv.x;
    
    posX = posX - uTransOut * uSide ;
    posY = posY - uRandY1 * uTransOut * (1.0 - uv.x);
    posZ = posZ - 500. * uTransOut * (1.0 - uv.x);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix  * vec4(posX, posY, posZ, 1.0);
    vUv = uv;
    
    vec2 dMouse = vec2(gl_Position.x / gl_Position.w- uMouse.x , gl_Position.y/ gl_Position.w - uMouse.y);
	float mTheta = atan(dMouse.y, dMouse.x);
    float dis = length(dMouse);

    float scale;
    if(dis < 0.02){
        scale = dis/0.02 * 0.12 * max(dis * 2.0, 1.0);    
    }else{
        scale =(1.0 - clamp( dis - 0.02 , 0.0, 1.0)) * 0.12 * max(dis * 2.0, 1.0);
    }
    
    
	gl_Position.x = gl_Position.x + scale * cos(mTheta) * gl_Position.w;
    gl_Position.y = gl_Position.y + scale * sin(mTheta) * gl_Position.w;
    
    vAlpha = clamp(uTransIn * 2.0 - vUv.x, 0.0, 1.0) * clamp(1.0 + vUv.x- 2.0 * uTransOut, 0.0, 1.0 );
    vScale = dis;
}
`;

export const textureBaseShaderFragSrc = `
precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;
varying float vAlpha;

varying float vScale;
void main(){
    if(vAlpha < 0.001) discard;
    
    gl_FragColor = texture2D(uTexture, vUv);
    gl_FragColor.rgb = gl_FragColor.rgb + vec3( (clamp((1.0 - vScale/0.2), 0.0, 1.0) * 0.2 ));
    gl_FragColor.a *= vAlpha ;
}
`;

export const wireFrameFragSrc = `
precision mediump float;

void main(){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;
