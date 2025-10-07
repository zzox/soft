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

	multmat (m) {
		return new Matrix4(this.m00 * m.m00
			+ this.m10 * m.m01
			+ this.m20 * m.m02
			+ this.m30 * m.m03, this.m00 * m.m10
			+ this.m10 * m.m11
			+ this.m20 * m.m12
			+ this.m30 * m.m13,
			this.m00 * m.m20
			+ this.m10 * m.m21
			+ this.m20 * m.m22
			+ this.m30 * m.m23, this.m00 * m.m30
			+ this.m10 * m.m31
			+ this.m20 * m.m32
			+ this.m30 * m.m33,
			this.m01 * m.m00
			+ this.m11 * m.m01
			+ this.m21 * m.m02
			+ this.m31 * m.m03, this.m01 * m.m10
			+ this.m11 * m.m11
			+ this.m21 * m.m12
			+ this.m31 * m.m13,
			this.m01 * m.m20
			+ this.m11 * m.m21
			+ this.m21 * m.m22
			+ this.m31 * m.m23, this.m01 * m.m30
			+ this.m11 * m.m31
			+ this.m21 * m.m32
			+ this.m31 * m.m33,
			this.m02 * m.m00
			+ this.m12 * m.m01
			+ this.m22 * m.m02
			+ this.m32 * m.m03, this.m02 * m.m10
			+ this.m12 * m.m11
			+ this.m22 * m.m12
			+ this.m32 * m.m13,
			this.m02 * m.m20
			+ this.m12 * m.m21
			+ this.m22 * m.m22
			+ this.m32 * m.m23, this.m02 * m.m30
			+ this.m12 * m.m31
			+ this.m22 * m.m32
			+ this.m32 * m.m33,
			this.m03 * m.m00
			+ this.m13 * m.m01
			+ this.m23 * m.m02
			+ this.m33 * m.m03, this.m03 * m.m10
			+ this.m13 * m.m11
			+ this.m23 * m.m12
			+ this.m33 * m.m13,
			this.m03 * m.m20
			+ this.m13 * m.m21
			+ this.m23 * m.m22
			+ this.m33 * m.m23, this.m03 * m.m30
			+ this.m13 * m.m31
			+ this.m23 * m.m32
			+ this.m33 * m.m33)
	}

    multvec(value) {
		var product = new Vector4()
		product.x = this.m00 * value.x + this.m10 * value.y + this.m20 * value.z + this.m30 * value.w
		product.y = this.m01 * value.x + this.m11 * value.y + this.m21 * value.z + this.m31 * value.w
		product.z = this.m02 * value.x + this.m12 * value.y + this.m22 * value.z + this.m32 * value.w
		product.w = this.m03 * value.x + this.m13 * value.y + this.m23 * value.z + this.m33 * value.w
		return product;
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
