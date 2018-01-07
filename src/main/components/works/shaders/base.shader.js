export const baseShaderVertSrc = `
attribute vec4 position;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
}`;

export const uvBaseShaderVertSrc = `
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec2 vUv;
void main(){
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * position;
    vUv = uv;
}
`;

export const textureBaseShaderFragSrc = `
precision mediump float;

uniform sampler2D uTexture;
uniform float uAlpha;

varying vec2 vUv;

void main(){
    if(uAlpha == 0.0) discard;

    gl_FragColor = texture2D(uTexture, vUv);
    gl_FragColor.a *= uAlpha;
}

`;

export const wireFrameFragSrc = `
precision mediump float;

void main(){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;
