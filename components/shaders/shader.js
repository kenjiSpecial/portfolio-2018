export const vertexShader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

varying vec2 vUv;

void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
}
`;

// ==================

export const fragmentShader = `
precision highp float;

varying vec2 vUv;

void main(){
    gl_FragColor = vec4(vUv, 0.0, 1.0);
}
`;
