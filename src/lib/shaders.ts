export const BASIC_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec4 colors;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main() {
  vColor = colors;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(positions, 1.0);
}
`;

export const BASIC_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

export const TEXTURED_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec2 texCoords;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vTexCoord;

void main() {
  vTexCoord = texCoords;
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(positions, 1.0);
}
`;

export const TEXTURED_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  fragColor = texture(uTexture, vTexCoord);
}
`;

export const NORMAL_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 normals;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vNormal;
out vec3 vPosition;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(positions, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = mat3(uModelMatrix) * normals;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

export const NORMAL_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;

in vec3 vNormal;
in vec3 vPosition;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vPosition);

  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor * uDiffuseColor;
  vec3 ambient = uAmbientColor * uDiffuseColor;

  fragColor = vec4(ambient + diffuse, 1.0);
}
`;

export const PHONG_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 normals;
layout(location = 2) in vec2 texCoords;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vNormal;
out vec3 vPosition;
out vec2 vTexCoord;

void main() {
  vec4 worldPosition = uModelMatrix * vec4(positions, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = mat3(uModelMatrix) * normals;
  vTexCoord = texCoords;
  gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;
}
`;

export const PHONG_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform vec3 uCameraPosition;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform float uShininess;

in vec3 vNormal;
in vec3 vPosition;
in vec2 vTexCoord;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPosition - vPosition);
  vec3 viewDir = normalize(uCameraPosition - vPosition);
  vec3 reflectDir = reflect(-lightDir, normal);

  float diff = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);

  vec3 ambient = uAmbientColor * uDiffuseColor;
  vec3 diffuse = diff * uLightColor * uDiffuseColor;
  vec3 specular = spec * uLightColor * uSpecularColor;

  fragColor = vec4(ambient + diffuse + specular, 1.0);
}
`;

export const SIMPLE_TRIANGLE_VS_GLSL = /* glsl */ `#version 300 es
const vec2 pos[3] = vec2[3](vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));

void main() {
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
}
`;

export const SIMPLE_TRIANGLE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform vec4 uColor;
out vec4 fragColor;

void main() {
  fragColor = uColor;
}
`;

export const SIMPLE_TRIANGLE_WGSL = /* wgsl */ `
@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var positions = array<vec2<f32>, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );
  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}

@group(0) @binding(0) var<uniform> uColor: vec4<f32>;

@fragment
fn fragmentMain() -> @location(0) vec4<f32> {
  return uColor;
}
`;

export const GRADIENT_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec4 colors;

out vec4 vColor;

void main() {
  vColor = colors;
  gl_Position = vec4(positions, 1.0);
}
`;

export const GRADIENT_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;

export const INSTANCED_VS_GLSL = /* glsl */ `#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 instancePositions;
layout(location = 2) in vec4 instanceColors;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec4 vColor;

void main() {
  vColor = instanceColors;
  vec3 pos = positions + instancePositions;
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(pos, 1.0);
}
`;

export const INSTANCED_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main() {
  fragColor = vColor;
}
`;
