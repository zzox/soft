export class Vec2 {
    constructor (x, y) {
        this.x = x
        this.y = y
    }
}

export class Vec3 {
    constructor (x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }
}

export class Matrix3 {
    constructor (m00, m01, m02, m10, m11, m12, m20, m21, m22) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
    }
}

// multiply the vec3 by the matrix
export const vecMat3 = (vec3, mat3) => {
    return new Vec3(
        vec3.x * mat3.m00 + vec3.y * mat3.m01 + vec3.z * mat3.m02,
        vec3.x * mat3.m10 + vec3.y * mat3.m11 + vec3.z * mat3.m12,
        vec3.x * mat3.m20 + vec3.y * mat3.m21 + vec3.z * mat3.m22,
    )
}
