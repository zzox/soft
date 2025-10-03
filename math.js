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

	add (vec) {
		return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
	}

	sub(vec) {
		return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z)
	}

	mult(value) {
		return new Vec3(this.x * value, this.y * value, this.z * value)
	}

	dot(v) {
		return this.x * v.x + this.y * v.y + this.z * v.z
	}

	cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        )
	}

	normalize () {
		const mul = 1 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
		this.x *= mul
		this.y *= mul
		this.z *= mul
        return this
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

export class Matrix4 {
    constructor (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m03 = m03
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
        this.m13 = m13
        this.m20 = m20
        this.m21 = m21
        this.m22 = m22
        this.m23 = m23
        this.m30 = m30
        this.m31 = m31
        this.m32 = m32
        this.m33 = m33
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
