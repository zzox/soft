import { Vec2, Vec3 } from './math.js'

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

// const rotate = (point) => {
//     const a = Math.PI / 6;
//     const ry = new Matrix3(Math.cos(a),0,Math.sin(a), 0,1,0, -Math.sin(a),0,Math.cos(a))
//     return ry * point;
//     // return point
// }

const project = (point) => {
    // normalize and scale
    return new Vec3(Math.floor((point.x + 1) * width / 2), Math.floor((point.y + 1) * height / 2), Math.floor((point.z + 1) * 255 / 2))
}

const signedTriangleArea = (x1, y1, x2, y2, x3, y3) => {
    return .5 * ((y2 - y1) * (x2 + x1) + (y3 - y2) * (x3 + x2) + (y1 - y3) * (x1 + x3));
}

const drawTriangle = (x1, y1, z1, x2, y2, z2, x3, y3, z3, color, forZBuffer) => {
    const minX = Math.min(Math.min(x1, x2), x3)
    const maxX = Math.max(Math.max(x1, x2), x3)
    const minY = Math.min(Math.min(y1, y2), y3)
    const maxY = Math.max(Math.max(y1, y2), y3)

    const totalArea = signedTriangleArea(x1, y1, x2, y2, x3, y3)
    // console.log(totalArea)
    if (totalArea < 1) return // backface culling + discarding triangles that cover less than a pixel

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const alpha = signedTriangleArea(x, y, x2, y2, x3, y3) / totalArea
            const beta = signedTriangleArea(x, y, x3, y3, x1, y1) / totalArea
            const gamma = signedTriangleArea(x, y, x1, y1, x2, y2) / totalArea
            if (alpha < 0 || beta < 0 || gamma < 0) continue
            const z = Math.floor(alpha * z1 + beta * z2 + gamma * z3)
            color[3] = z
            // colorful triangle
            // setPixel(x, y, [Math.floor(255 * alpha), Math.floor(255 * beta), Math.floor(255 * gamma), 255])
            // console.log(x, y)

            if (z <= getZBuffer(x, y)) continue

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
    const v1 = project(verticies[vr1 - 1])
    const v2 = project(verticies[vr2 - 1])
    const v3 = project(verticies[vr3 - 1])

    const color = [pink, white, green, red, blue, yellow][Math.floor(Math.random() * 6)]

    drawTriangle(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, color, zBuffer)
}

const putPixel = (vertex) => {
    const v = project(vertex)
    setPixel(v[0], v[1], white)
}

window.onload = async () => {
    const answer = await fetch('./african-head.obj')
    const text = await answer.text()

    console.time('parse')
    const { verticies, faces } = parseObj(text)
    console.timeEnd('parse')
    console.log(verticies, faces)

    faces.map((face) => drawFace(verticies, face))
    zBuffer.fill(0) // clear zBuffer
    faces.map((face) => drawFace(verticies, face, true))

    // verticies.forEach(putPixel)

    console.time('put')
    ctx.putImageData(imageData, 0, 0)
    ctx2.putImageData(bufferData, 0, 0)
    console.timeEnd('put')

    console.timeEnd('full')
}
