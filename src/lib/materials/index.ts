// ============================================================================
// Material System
// ============================================================================

export interface MaterialOptions {
	color?: [number, number, number];
	opacity?: number;
	transparent?: boolean;
	side?: 'front' | 'back' | 'double';
	wireframe?: boolean;
	depthTest?: boolean;
	depthWrite?: boolean;
}

export interface PhongMaterialOptions extends MaterialOptions {
	shininess?: number;
	specular?: [number, number, number];
	emissive?: [number, number, number];
	emissiveIntensity?: number;
}

export interface StandardMaterialOptions extends MaterialOptions {
	roughness?: number;
	metalness?: number;
	emissive?: [number, number, number];
	emissiveIntensity?: number;
}

// ============================================================================
// Basic Material
// ============================================================================

export const BASIC_MATERIAL_VS = `#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vNormal = mat3(uModelMatrix) * normals;
    vTexCoord = texCoords;
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(positions, 1.0);
}
`;

export const BASIC_MATERIAL_FS = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uColor;
uniform float uOpacity;

out vec4 fragColor;

void main() {
    fragColor = vec4(uColor, uOpacity);
}
`;

export function createBasicMaterial(options: MaterialOptions = {}) {
	const color = options.color ?? [1, 1, 1];
	const opacity = options.opacity ?? 1.0;

	return {
		vs: BASIC_MATERIAL_VS,
		fs: BASIC_MATERIAL_FS,
		uniforms: {
			uColor: color,
			uOpacity: opacity
		},
		parameters: {
			cullMode: options.side === 'double' ? 'none' : options.side === 'back' ? 'front' : 'back',
			depthTest: options.depthTest ?? true,
			depthWrite: options.depthWrite ?? true,
			...(options.transparent && {
				blend: true,
				blendSrcFactor: 'src-alpha',
				blendDstFactor: 'one-minus-src-alpha'
			})
		}
	};
}

// ============================================================================
// Normal Material (debug)
// ============================================================================

export const NORMAL_MATERIAL_VS = `#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

out vec3 vNormal;

void main() {
    vNormal = normalize(mat3(uModelMatrix) * normals);
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(positions, 1.0);
}
`;

export const NORMAL_MATERIAL_FS = `#version 300 es
precision highp float;

in vec3 vNormal;

out vec4 fragColor;

void main() {
    fragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
}
`;

export function createNormalMaterial() {
	return {
		vs: NORMAL_MATERIAL_VS,
		fs: NORMAL_MATERIAL_FS,
		uniforms: {},
		parameters: {
			cullMode: 'back',
			depthTest: true,
			depthWrite: true
		}
	};
}

// ============================================================================
// Phong Material (with lighting)
// ============================================================================

export const PHONG_MATERIAL_VS = `#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vec4 worldPos = uModelMatrix * vec4(positions, 1.0);
    vPosition = worldPos.xyz;
    vNormal = normalize(mat3(uModelMatrix) * normals);
    vTexCoord = texCoords;
    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
`;

export const PHONG_MATERIAL_FS = `#version 300 es
precision highp float;

#define MAX_LIGHTS 8

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uShininess;
uniform vec3 uSpecular;
uniform vec3 uEmissive;
uniform float uEmissiveIntensity;
uniform vec3 uCameraPosition;

// Lighting
uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform int uLightTypes[MAX_LIGHTS]; // 0: point, 1: directional, 2: spot, 3: ambient

// Ambient
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPosition - vPosition);

    vec3 ambient = uAmbientColor * uAmbientIntensity;
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uLightCount) break;

        vec3 lightDir;
        float attenuation = 1.0;

        if (uLightTypes[i] == 1) {
            // Directional light
            lightDir = normalize(-uLightPositions[i]);
        } else {
            // Point light
            vec3 lightVec = uLightPositions[i] - vPosition;
            float distance = length(lightVec);
            lightDir = normalize(lightVec);
            attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
        }

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        diffuse += diff * uLightColors[i] * uLightIntensities[i] * attenuation;

        // Specular (Blinn-Phong)
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), uShininess);
        specular += spec * uSpecular * uLightColors[i] * uLightIntensities[i] * attenuation;
    }

    vec3 emissive = uEmissive * uEmissiveIntensity;
    vec3 result = (ambient + diffuse) * uColor + specular + emissive;

    fragColor = vec4(result, uOpacity);
}
`;

export function createPhongMaterial(options: PhongMaterialOptions = {}) {
	const color = options.color ?? [1, 1, 1];
	const opacity = options.opacity ?? 1.0;
	const shininess = options.shininess ?? 30.0;
	const specular = options.specular ?? [1, 1, 1];
	const emissive = options.emissive ?? [0, 0, 0];
	const emissiveIntensity = options.emissiveIntensity ?? 1.0;

	return {
		vs: PHONG_MATERIAL_VS,
		fs: PHONG_MATERIAL_FS,
		uniforms: {
			uColor: color,
			uOpacity: opacity,
			uShininess: shininess,
			uSpecular: specular,
			uEmissive: emissive,
			uEmissiveIntensity: emissiveIntensity,
			uAmbientColor: [0.1, 0.1, 0.1],
			uAmbientIntensity: 1.0,
			uLightCount: 0,
			uLightPositions: new Array(8).fill([0, 0, 0]).flat(),
			uLightColors: new Array(8).fill([1, 1, 1]).flat(),
			uLightIntensities: new Array(8).fill(1.0),
			uLightTypes: new Array(8).fill(0)
		},
		parameters: {
			cullMode: options.side === 'double' ? 'none' : options.side === 'back' ? 'front' : 'back',
			depthTest: options.depthTest ?? true,
			depthWrite: options.depthWrite ?? true,
			...(options.transparent && {
				blend: true,
				blendSrcFactor: 'src-alpha',
				blendDstFactor: 'one-minus-src-alpha'
			})
		}
	};
}

// ============================================================================
// Lambert Material (diffuse only)
// ============================================================================

export const LAMBERT_MATERIAL_VS = PHONG_MATERIAL_VS;

export const LAMBERT_MATERIAL_FS = `#version 300 es
precision highp float;

#define MAX_LIGHTS 8

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uEmissive;
uniform float uEmissiveIntensity;

// Lighting
uniform int uLightCount;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform int uLightTypes[MAX_LIGHTS];

uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);

    vec3 ambient = uAmbientColor * uAmbientIntensity;
    vec3 diffuse = vec3(0.0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uLightCount) break;

        vec3 lightDir;
        float attenuation = 1.0;

        if (uLightTypes[i] == 1) {
            lightDir = normalize(-uLightPositions[i]);
        } else {
            vec3 lightVec = uLightPositions[i] - vPosition;
            float distance = length(lightVec);
            lightDir = normalize(lightVec);
            attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
        }

        float diff = max(dot(normal, lightDir), 0.0);
        diffuse += diff * uLightColors[i] * uLightIntensities[i] * attenuation;
    }

    vec3 emissive = uEmissive * uEmissiveIntensity;
    vec3 result = (ambient + diffuse) * uColor + emissive;

    fragColor = vec4(result, uOpacity);
}
`;

export function createLambertMaterial(options: MaterialOptions & { emissive?: [number, number, number]; emissiveIntensity?: number } = {}) {
	const color = options.color ?? [1, 1, 1];
	const opacity = options.opacity ?? 1.0;
	const emissive = options.emissive ?? [0, 0, 0];
	const emissiveIntensity = options.emissiveIntensity ?? 1.0;

	return {
		vs: LAMBERT_MATERIAL_VS,
		fs: LAMBERT_MATERIAL_FS,
		uniforms: {
			uColor: color,
			uOpacity: opacity,
			uEmissive: emissive,
			uEmissiveIntensity: emissiveIntensity,
			uAmbientColor: [0.1, 0.1, 0.1],
			uAmbientIntensity: 1.0,
			uLightCount: 0,
			uLightPositions: new Array(8).fill([0, 0, 0]).flat(),
			uLightColors: new Array(8).fill([1, 1, 1]).flat(),
			uLightIntensities: new Array(8).fill(1.0),
			uLightTypes: new Array(8).fill(0)
		},
		parameters: {
			cullMode: options.side === 'double' ? 'none' : options.side === 'back' ? 'front' : 'back',
			depthTest: options.depthTest ?? true,
			depthWrite: options.depthWrite ?? true,
			...(options.transparent && {
				blend: true,
				blendSrcFactor: 'src-alpha',
				blendDstFactor: 'one-minus-src-alpha'
			})
		}
	};
}

// ============================================================================
// Instanced Material
// ============================================================================

export const INSTANCED_MATERIAL_VS = `#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;
in mat4 instanceModelMatrix;
in vec4 instanceColor;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

out vec3 vNormal;
out vec4 vColor;

void main() {
    vNormal = normalize(mat3(instanceModelMatrix) * normals);
    vColor = instanceColor;
    gl_Position = uProjectionMatrix * uViewMatrix * instanceModelMatrix * vec4(positions, 1.0);
}
`;

export const INSTANCED_MATERIAL_FS = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec4 vColor;

out vec4 fragColor;

void main() {
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 ambient = vec3(0.2);
    vec3 diffuse = diff * vec3(0.8);
    fragColor = vec4((ambient + diffuse) * vColor.rgb, vColor.a);
}
`;

export function createInstancedMaterial() {
	return {
		vs: INSTANCED_MATERIAL_VS,
		fs: INSTANCED_MATERIAL_FS,
		uniforms: {},
		parameters: {
			cullMode: 'back',
			depthTest: true,
			depthWrite: true
		}
	};
}
