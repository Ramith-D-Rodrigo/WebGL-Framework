#version 300 es

precision highp float;

in vec2 texCoord;
in vec3 normalFrag;

out vec4 color;

struct DirectionalLight {
    vec3 color;
    float ambientIntensity;
    vec3 direction;
    float diffuseIntensity;
};

uniform sampler2D theTexture;
uniform DirectionalLight directionalLight;

void main() {
    vec4 ambientColor = vec4(directionalLight.color, 1.0) * directionalLight.ambientIntensity;

    float diffuseFactor = max(dot(normalize(normalFrag), -normalize(directionalLight.direction)), 0.0f);
    vec4 diffuseColor = vec4(directionalLight.color, 1.0) * directionalLight.diffuseIntensity * diffuseFactor;

    vec4 textureVal = texture(theTexture, texCoord);
    color = textureVal * (ambientColor + diffuseColor);
}