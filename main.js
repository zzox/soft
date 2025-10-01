console.time('full')
const width = 512
const height = 512
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const imageData = ctx.createImageData(width, height)

canvas.style.backgroundColor = 'black'

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
    // are parens necessary?
    y = wglFlipY(y)

    imageData.data[(y * imageData.width * 4) + (x * 4)] = b
    imageData.data[(y * imageData.width * 4) + (x * 4) + 1] = g
    imageData.data[(y * imageData.width * 4) + (x * 4) + 2] = r
    imageData.data[(y * imageData.width * 4) + (x * 4) + 3] = a

    // zbuffer
    // imageData.data[(y * imageData.width * 4) + (x * 4)] = a
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 1] = a
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 2] = a
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 3] = 255

    // funny colors
    // imageData.data[(y * imageData.width * 4) + (x * 4)] = Math.floor(b * (1 - (a / 255)))
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 1] = Math.floor(g * (0.5 + (a / 128)))
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 2] = Math.floor(r * a / 255)
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 3] = 255

    // instead of setting alpha, we set a instead of
    // imageData.data[(y * imageData.width * 4) + (x * 4)] = Math.floor(b * (a / 255))
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 1] = Math.floor(g * (a / 255))
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 2] = Math.floor(r * (a / 255))
    // imageData.data[(y * imageData.width * 4) + (x * 4) + 3] = 255
}

canvas.style.width = `512px`
canvas.style.height = `512px`
canvas.style.imageRendering = 'pixelated'

// ctx.fillStyle = 'black'
// ctx.fillRect(0, 0, 64, 64)

// make black instead of transparent by making alpha 255
// dont use
// for (let i = 0; i < imageData.data.length; i += 4) {
//     imageData.data[i + 3] = 255
// }

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
                const [v, v1, v2, v3] = line.split(' ')
                return [parseFloat(v1), parseFloat(v2), parseFloat(v3)]
            }),
        faces: // just the first part after each space
            fLines.map(line => {
                const [f, f1, f2, f3] = line.split(' ')
                return [faceParse(f1)[0], faceParse(f2)[0], faceParse(f3)[0]]
            })
    }
}

const swap = (p1, p2) => {
    return [p2, p1]
}

// from round 4 of optimizations here: https://haqr.eu/tinyrenderer/bresenham/
// TODO: do my own testing
const drawLine = (x1, y1, x2, y2, /* TGAImage &framebuffer, */ color) => {
    // const [b, g, r, a] = color

    // if the line is steep, we transpose the image
    const steep = Math.abs(x1 - x2) < Math.abs(y1 - y2)
    if (steep) {
        ;[x1, y1] = swap(x1, y1)
        ;[x2, y2] = swap(x2, y2)
    }

    // make it left−to−right
    if (x1 > x2) {
        ;[x1, x2] = swap(x1, x2)
        ;[y1, y2] = swap(y1, y2)
    }

    let y = y1
    let ierror = 0
    for (let x = x1; x <= x2; x++) {
        if (steep) // if transposed, de−transpose
            setPixel(y, x, color)
        else
            setPixel(x, y, color)
        ierror += 2 * Math.abs(y2 - y1)
        y += (y2 > y1 ? 1 : -1) * (ierror > x2 - x1)
        ierror -= 2 * (x2 - x1) * (ierror > x2 - x1)
    }
}

const project = ([x, y, z]) => {
    // normalize and scale
    return [Math.floor((x + 1) * width / 2), Math.floor((y + 1) * height / 2), Math.floor((z + 1) * 255 / 2)]
    // return [Math.floor((x + 1) * width / 2), wglFlipY(Math.floor((y + 1) * height / 2))]
}

const drawTriangleScanline = (x1, y1, x2, y2, x3, y3, color) => {
    if (y1 > y2) { [x1, x2] = swap(x1, x2); [y1, y2] = swap(y1, y2); }
    if (y1 > y3) { [x1, x3] = swap(x1, x3); [y1, y3] = swap(y1, y3); }
    if (y2 > y3) { [x2, x3] = swap(x2, x3); [y2, y3] = swap(y2, y3); }

    const total_height = y3 - y1

    if (y1 != y2) { // if the bottom half is not degenerate
        const segment_height = y2 - y1
        for (let y=y1; y<=y2; y++) { // sweep the horizontal line from y1 to y2
            const xx1 = Math.floor(x1 + ((x3 - x1)*(y - y1)) / total_height)
            const xx2 = Math.floor(x1 + ((x2 - x1)*(y - y1)) / segment_height)
            for (let x = Math.min(xx1, xx2); x < Math.max(xx1, xx2); x++)  // draw a horizontal line
                setPixel(x, y, color);
        }
    }
    if (y2 != y3) { // if the upper half is not degenerate
        const segment_height = y3 - y2;
        for (let y=y2; y<=y3; y++) { // sweep the horizontal line from y2 to y3
            const xx1 = Math.floor(x1 + ((x3 - x1)*(y - y1)) / total_height)
            const xx2 = Math.floor(x2 + ((x3 - x2)*(y - y2)) / segment_height)
            for (let x = Math.min(xx1, xx2); x < Math.max(xx1, xx2); x++)  // draw a horizontal line
                setPixel(x, y, color);
        }
    }
}

const signedTriangleArea = (x1, y1, x2, y2, x3, y3) => {
    return .5 * ((y2 - y1) * (x2 + x1) + (y3 - y2) * (x3 + x2) + (y1 - y3) * (x1 + x3));
}

const drawTriangle = (x1, y1, z1, x2, y2, z2, x3, y3, z3, color) => {
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
            setPixel(x, y, color)
            // color[3] = 255
        }
    }

    // draw wireframes
    // for (let x = minX; x <= maxX; x++) {
    //     for (let y = minY; y <= maxY; y++) {
    //         const alpha = signedTriangleArea(x, y, x2, y2, x3, y3) / totalArea
    //         const beta = signedTriangleArea(x, y, x3, y3, x1, y1) / totalArea
    //         const gamma = signedTriangleArea(x, y, x1, y1, x2, y2) / totalArea
    //         if (alpha > 0 && beta > 0 && gamma > 0) {
    //             if (alpha < 0.1 || beta < 0.1 || gamma < 0.1) {
    //                 color[3] = Math.floor(alpha * z1 + beta * z2 + gamma * z3)
    //                 setPixel(x, y, color)
    //             }
    //         }
    //         // color[3] = 255
    //     }
    // }

    // drawLine(x1, y1, x2, y2, color)
    // drawLine(x2, y2, x3, y3, color)
    // drawLine(x3, y3, x1, y1, color)
}

const drawFace = (verticies, [vr1, vr2, vr3]) => {
    // - 1 because the verticies are 1-indexed, not 0
    const v1 = project(verticies[vr1 - 1])
    const v2 = project(verticies[vr2 - 1])
    const v3 = project(verticies[vr3 - 1])

    const color = [pink, white, green, red, blue, yellow][Math.floor(Math.random() * 6)]

    drawTriangle(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2], color)
}

const putPixel = (vertex) => {
    const v = project(vertex)
    setPixel(v[0], v[1], white)
}

// drawTriangle(  7, 45, 35, 100, 45,  60, red)
// drawTriangle(120, 35, 90,   5, 45, 110, white)
// drawTriangle(115, 83, 80,  90, 85, 120, green)

// sort faces (render back to front)
// faces.sort(([a1, a2, a3], [b1, b2, b3]) => {
//     const v1 = project(verticies[a1 - 1])
//     const v2 = project(verticies[a2 - 1])
//     const v3 = project(verticies[a3 - 1])
//     const w1 = project(verticies[b1 - 1])
//     const w2 = project(verticies[b2 - 1])
//     const w3 = project(verticies[b3 - 1])
//     return (v1[2] + v2[2] + v3[2]) - (w1[2] + w2[2] + v3[2])
// })

window.onload = async () => {
    const answer = await fetch('./diablo-3-pose.obj')
    const text = await answer.text()

    console.time('parse')
    const { verticies, faces } = parseObj(text)
    console.timeEnd('parse')
    console.log(verticies, faces)

    faces.map((face) => drawFace(verticies, face))

    // verticies.forEach(putPixel)

    console.time('put')
    ctx.putImageData(imageData, 0, 0)
    console.timeEnd('put')

    console.timeEnd('full')
}
