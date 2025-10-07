import { Matrix4 } from './math.js'

export const makeViewport = (x, y, w, h) => {
  return new Matrix4(w/2,0,0,x+w/2, 0,h/2,0,y+h/2, 0,0,1,0, 0,0,0,1)
}

// f is focal distance
export const makePerspective = (f) => {
  return new Matrix4(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-1/f,1);
}

export const lookAt = (eye, at, up) => {
  var zaxis = at.sub(eye).normalize()
  var xaxis = zaxis.cross(up).normalize()
  var yaxis = xaxis.cross(zaxis)

  return (new Matrix4(
    xaxis.x, xaxis.y, xaxis.z, -xaxis.dot(eye),
    yaxis.x, yaxis.y, yaxis.z, -yaxis.dot(eye),
    -zaxis.x, -zaxis.y, -zaxis.z, zaxis.dot(eye),
    0, 0, 0, 1
  )).multmat(new Matrix4(
    1,0,0,-at.x,
    0,1,0,-at.y,
    0,0,1,-at.z,
    0,0,0,1
  ))
}
