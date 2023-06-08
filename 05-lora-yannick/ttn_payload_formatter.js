
function decodeUplink(input) {
  let warnings = []
  let errors = []
  let bytes = input.bytes

  const rechk = /^([<>])?(([1-9]\d*)?([xcbB?hHiIfdsp]))*$/
  const refmt = /([1-9]\d*)?([xcbB?hHiIfdsp])/g
  const str = (v,o,c) => String.fromCharCode(
      ...new Uint8Array(v.buffer, v.byteOffset + o, c))
  const rts = (v,o,c,s) => new Uint8Array(v.buffer, v.byteOffset + o, c)
      .set(s.split('').map(str => str.charCodeAt(0)))
  const pst = (v,o,c) => str(v, o + 1, Math.min(v.getUint8(o), c - 1))
  const tsp = (v,o,c,s) => { v.setUint8(o, s.length); rts(v, o + 1, c - 1, s) }
  const lut = le => ({
      x: c=>[1,c,0],
      c: c=>[c,1,o=>({u:v=>str(v, o, 1)      , p:(v,c)=>rts(v, o, 1, c)     })],
      '?': c=>[c,1,o=>({u:v=>Boolean(v.getUint8(o)),p:(v,B)=>v.setUint8(o,B)})],
      b: c=>[c,1,o=>({u:v=>v.getInt8(   o   ), p:(v,b)=>v.setInt8(   o,b   )})],
      B: c=>[c,1,o=>({u:v=>v.getUint8(  o   ), p:(v,B)=>v.setUint8(  o,B   )})],
      h: c=>[c,2,o=>({u:v=>v.getInt16(  o,le), p:(v,h)=>v.setInt16(  o,h,le)})],
      H: c=>[c,2,o=>({u:v=>v.getUint16( o,le), p:(v,H)=>v.setUint16( o,H,le)})],
      i: c=>[c,4,o=>({u:v=>v.getInt32(  o,le), p:(v,i)=>v.setInt32(  o,i,le)})],
      I: c=>[c,4,o=>({u:v=>v.getUint32( o,le), p:(v,I)=>v.setUint32( o,I,le)})],
      f: c=>[c,4,o=>({u:v=>v.getFloat32(o,le), p:(v,f)=>v.setFloat32(o,f,le)})],
      d: c=>[c,8,o=>({u:v=>v.getFloat64(o,le), p:(v,d)=>v.setFloat64(o,d,le)})],
      s: c=>[1,c,o=>({u:v=>str(v,o,c), p:(v,s)=>rts(v,o,c,s.slice(0,c    ) )})],
      p: c=>[1,c,o=>({u:v=>pst(v,o,c), p:(v,s)=>tsp(v,o,c,s.slice(0,c - 1) )})]
  })
  const errbuf = new RangeError("Structure larger than remaining buffer")
  const errval = new RangeError("Not enough values for structure")
  function struct(format) {
      let fns = [], size = 0, m = rechk.exec(format)
      if (!m) { throw new RangeError("Invalid format string") }
      const t = lut('<' === m[1]), lu = (n, c) => t[c](n ? parseInt(n, 10) : 1)
      while ((m = refmt.exec(format))) { ((r, s, f) => {
          for (let i = 0; i < r; ++i, size += s) { if (f) {fns.push(f(size))} }
      })(...lu(...m.slice(1)))}
      const unpack_from = (arrb, offs) => {
          if (arrb.byteLength < (offs|0) + size) { throw errbuf }
          let v = new DataView(arrb, offs|0)
          return fns.map(f => f.u(v))
      }

      const unpack = arrb => unpack_from(arrb, 0)
      return Object.freeze({
          unpack, unpack_from, format, size})
  }

  let s = struct('>bfffbi')
  // TODO(yw): check size before you parse. warnings.push("Payload does match parsing, skipping")

  let [device_state, latitude, longitute, temperature, humidity, co2_ppm] = s.unpack(new Uint8Array(bytes).buffer)

  let data = {
    device_state: device_state,
    latitude:  latitude,
    longitude: longitute,
    temperature: temperature,
    humidity: humidity,
    co2_ppm: co2_ppm,
  }

  return {
    data: data,
    warnings: warnings,
    errors: errors,
  }
}
