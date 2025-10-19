import { Vec2, Vec3, Matrix3, vecMat3, Vec4 } from './math.js'
import { makeViewport, makePerspective, lookAt } from './gl.js'

console.time('full')
const width = 512
const height = 512
const canvas = document.querySelector('#main-canvas')
const ctx = canvas.getContext('2d')
const imageData = ctx.createImageData(width, height)
canvas.style.backgroundColor = 'black'

const bufferCanvas = document.querySelector('#buffer-canvas')
const ctx2 = bufferCanvas.getContext('2d')
const bufferData = ctx2.createImageData(width, height)
bufferCanvas.style.backgroundColor = 'black'

canvas.style.width = `512px`
canvas.style.height = `512px`
canvas.style.imageRendering = 'pixelated'

bufferCanvas.style.width = `512px`
bufferCanvas.style.height = `512px`
bufferCanvas.style.imageRendering = 'pixelated'

// all colors are black
// for (let i = 0; i < 64 * 64; i++) {
//     imageData.data[i] = 0;
//     imageData.data[i + 1] = 0;
//     imageData.data[i + 2] = 0;
//     imageData.data[i + 3] = 255;
// }

const eye = new Vec3(-1,0,2) // camera position
const center = new Vec3(0,0,0)  // camera direction
const up = new Vec3(0,1,0)  // camera up vector

let perspective = makePerspective(-1)
let modelView = lookAt(eye, center, up)
let viewport = makeViewport(width / 16, height / 16, width * 7 / 8, height * 7 / 8)

console.log(perspective, modelView, viewport, eye.sub(center).normalize())

// int 8 array doesn't work (for our examples) because we end up too close to the cam and Int8Array are signed ints
const zBuffer = new Int16Array(width * height)
console.log('zBuffer length', zBuffer.length)

const getZBuffer = (x, y) => zBuffer[y * width + x]

const setZBuffer = (x, y, z) => { zBuffer[y * width + x] = z }

const pink = [255, 0, 255, 255]
const white = [255, 255, 255, 255]
const green = [0, 255, 0, 255]
const red = [255, 0, 0, 255]
const blue = [64, 128, 255, 255]
const yellow = [255, 200, 0, 255]

const wglFlipY = (val) => -val + height

const setPixel = (x, y, [b, g, r, a]) => {
    y = wglFlipY(y)

    // are parens necessary?
    imageData.data[(y * imageData.width * 4) + (x * 4)] = b
    imageData.data[(y * imageData.width * 4) + (x * 4) + 1] = g
    imageData.data[(y * imageData.width * 4) + (x * 4) + 2] = r
    imageData.data[(y * imageData.width * 4) + (x * 4) + 3] = 255
}

const setZPixel = (x, y, [b, g, r, a]) => {
    y = wglFlipY(y)
    // zbuffer
    bufferData.data[(y * bufferData.width * 4) + (x * 4)] = a
    bufferData.data[(y * bufferData.width * 4) + (x * 4) + 1] = a
    bufferData.data[(y * bufferData.width * 4) + (x * 4) + 2] = a
    bufferData.data[(y * bufferData.width * 4) + (x * 4) + 3] = 255
}

// converts '123/12/1' to [123, 12, 1]
const faceParse = (fv) => fv.split('/').map(item => parseInt(item))

const parseObj = (obj) => {
    const lines = obj.split('\n')

    const vLines = lines.filter(line => line.slice(0, 2) === 'v ')
    const fLines = lines.filter(line => line.slice(0, 2) === 'f ')
    console.log(`parsed ${vLines.length} verticies and ${fLines.length} faces`)

    return {
        verticies:
            vLines.map(line => {
                const [_, v1, v2, v3] = line.split(' ')
                return new Vec3(parseFloat(v1), parseFloat(v2), parseFloat(v3))
            }),
        faces: // just the first part after each space
            fLines.map(line => {
                const [_, f1, f2, f3] = line.split(' ')
                return [faceParse(f1)[0], faceParse(f2)[0], faceParse(f3)[0]]
            })
    }
}

const rotate = (point) => {
    // const a = Math.PI / 6
    const ry = new Matrix3(Math.cos(rotation),0,Math.sin(rotation), 0,1,0, -Math.sin(rotation),0,Math.cos(rotation))
    return vecMat3(point, ry)
}

const persp = (point) => {
    const c = 3.0 // lower is more fisheye-like, don't go below 1
    const it = (1 - point.z / c)
    return new Vec3(
        point.x / it, point.y / it, point.z / it
    )
}

const project = (point) => {
    // normalize and scale
    // return new Vec4(Math.floor((point.x + 1) * width / 2), Math.floor((point.y + 1) * height / 2), Math.floor((point.z + 1) * 255 / 2), 1.0)
    return new Vec4(point.x, point.y, point.z, 1.0)
}

const signedTriangleArea = (x1, y1, x2, y2, x3, y3) => {
    return .5 * ((y2 - y1) * (x2 + x1) + (y3 - y2) * (x3 + x2) + (y1 - y3) * (x1 + x3));
}

const rasterize = (clip, color, forZBuffer) => {
    // normalized device coordinates
    const ndc = [clip[0].mult(1 / clip[0].w), clip[1].mult(1 / clip[1].w), clip[2].mult(1 / clip[2].w)]
    const s1 = viewport.multvec(ndc[0])
    const s2 = viewport.multvec(ndc[1])
    const s3 = viewport.multvec(ndc[2])
    const screen = [{ x: s1.x, y: s1.y }, { x: s2.x, y: s2.y }, { x: s3.x, y: s3.y }]

    const abc = new Matrix3(screen[0].x, screen[0].y, 1, screen[1].x, screen[1].y, 1, screen[2].x, screen[2].y, 1)
    if (abc.determinant() < 1) return

    const minX = Math.floor(Math.min(Math.min(screen[0].x, screen[1].x), screen[2].x))
    const maxX = Math.floor(Math.max(Math.max(screen[0].x, screen[1].x), screen[2].x))
    const minY = Math.floor(Math.min(Math.min(screen[0].y, screen[1].y), screen[2].y))
    const maxY = Math.floor(Math.max(Math.max(screen[0].y, screen[1].y), screen[2].y))

    // const totalArea = signedTriangleArea(clip[0].x, clip[0].y, clip[1].x, clip[1].y, clip[2].x, clip[2].y)
    if (Math.random() < 0.01) {
        console.log(clip, ndc, screen)
    }
    // if (abc < 1) return // backface culling + discarding triangles that cover less than a pixel

    // console.log('tri')

    // if (Math.random() < 0.01) {
    //     console.log(minX, minY, maxX, maxY)
    // }

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY + 128; y <= maxY + 128; y++) {
    // for (let x = Math.max(minX, 0); x <= Math.min(maxX, width - 1); x++) {
    //     for (let y = Math.max(minY, 0); y <= Math.min(maxY, height - 1); y++) {
            // const alpha = signedTriangleArea(x, y, clip[1].x, clip[1].y, clip[2].x, clip[2].y) / totalArea
            // const beta = signedTriangleArea(x, y, clip[2].x, clip[2].y, clip[0].x, clip[0].y) / totalArea
            // const gamma = signedTriangleArea(x, y, clip[0].x, clip[0].y, clip[1].x, clip[1].y) / totalArea
            // if (alpha < 0 || beta < 0 || gamma < 0) continue
            // const z = Math.floor(alpha * clip[0].z + beta * clip[1].z + gamma * clip[2].z)

            const bc = abc.inverse().transpose().multvec(new Vec2(x, y))

            // if (Math.random() < 0.001) {
            //     console.log(bc)
            // }

            if (bc.x<0 || bc.y<0 || bc.z<0) continue                               // negative barycentric coordinate => the pixel is outside the triangle
            const z = bc.x * ndc[0].z + bc.y * ndc[1].z + bc.y * ndc[2].z

            color[3] = z
            // colorful triangle
            // setPixel(x, y, [Math.floor(255 * alpha), Math.floor(255 * beta), Math.floor(255 * gamma), 255])

            if (z <= getZBuffer(x, y)) continue

            // console.log(Math.floor(x), Math.floor(y), color)

            setZBuffer(x, y, z)
            if (forZBuffer) {
                setZPixel(x, y, color)
            } else {
                setPixel(x, y, color)
            }
            // color[3] = 255
        }
    }
}

const drawFace = (verticies, [vr1, vr2, vr3], zBuffer = false) => {
    // - 1 because the verticies are 1-indexed, not 0
    const v1 = project(persp(rotate(verticies[vr1 - 1])))
    const v2 = project(persp(rotate(verticies[vr2 - 1])))
    const v3 = project(persp(rotate(verticies[vr3 - 1])))

    const color = [pink, white, green, red, blue, yellow][Math.floor(Math.random() * 6)]

    drawTriangle(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, color, zBuffer)
}

const putPixel = (vertex) => {
    const v = project(vertex)
    setPixel(v[0], v[1], white)
}

let rotation = Math.PI / 6
let verticies, faces

const draw = () => {
    // console.time('put')
    for (let i = 0; i < imageData.data.length; i++) {
        imageData.data[i] = 0
        bufferData.data[i] = 0
    }

    zBuffer.fill(0) // clear zBuffer
    faces.map((face) => {

        const clip = [0, 1, 2].map(i => {
            const v = verticies[face[i] - 1]

            // console.log(v, perspective, modelView, perspective.multmat(modelView).multvec(project(v)))
            // console.log(perspective.multmat(modelView), perspective.multmat(modelView).multvec(new Vec4(v.x * 255, v.y * 255, v.z * 255, 1)))
            // return new Vec4(Math.floor(v.x * 255), Math.floor(v.y * 255), Math.floor(v.z * 255), 1)
            // console.log(project(v.x, v.y, v.z), v.x)
            return perspective.multmat(modelView).multvec(project(v))
            // return project(v)



            // const v1 = project(persp(rotate(verticies[vr1 - 1])))
            // const v2 = project(persp(rotate(verticies[vr2 - 1])))
            // const v3 = project(persp(rotate(verticies[vr3 - 1])))

            // verticies[vr1 - 1]
            // verticies[vr2 - 1]
            // verticies[vr3 - 1]
        })
        //     vec4 clip[3];
        //     for (int d : {0,1,2}) {            // assemble the primitive
        //         vec3 v = model.vert(i, d);
        //         clip[d] = Projection * ModelView * vec4{v.x, v.y, v.z, 1.};
        //     }
        //     TGAColor rnd;
        //     for (int c=0; c<3; c++) rnd[c] = std::rand()%255;
        //     rasterize(clip, zbuffer, framebuffer, rnd); // rasterize the primitive
        // }
        // - 1 because the verticies are 1-indexed, not 0

        // const v1 = project(persp(rotate(verticies[face[0] - 1])))
        // const v2 = project(persp(rotate(verticies[face[1] - 1])))
        // const v3 = project(persp(rotate(verticies[face[2] - 1])))

        const color = [pink, white, green, red, blue, yellow][Math.floor(Math.random() * 6)]

        rasterize(clip, color, false)
        // rasterize(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, color, false)
        // drawFace(verticies, face)
    })
    zBuffer.fill(0) // clear zBuffer
    faces.map((face) => {
        // const v1 = project(persp(rotate(verticies[face[0] - 1])))
        // const v2 = project(persp(rotate(verticies[face[1] - 1])))
        // const v3 = project(persp(rotate(verticies[face[2] - 1])))

        // const color = [pink, white, green, red, blue, yellow][Math.floor(Math.random() * 6)]

        // rasterize(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, color, true)
        // drawFace(verticies, face, true)
    })

    ctx.putImageData(imageData, 0, 0)
    ctx2.putImageData(bufferData, 0, 0)
    // console.timeEnd('put')

    // console.timeEnd('full')

    setTimeout(() => {
        rotation += 0.1
        // draw()
    }, 100)
}

window.onload = async () => {
    const answer = await fetch('./african-head.obj')
    const text = await answer.text()

    console.time('parse')
    // const { verticies, faces } = parseObj(text)
    const obj = parseObj(text)
    verticies = obj.verticies
    faces = obj.faces
    console.timeEnd('parse')
    console.log(verticies, faces)

    draw()
}
