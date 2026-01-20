export function encode(obj: any) {
  const data = Buffer.from(JSON.stringify(obj))
  const buffer = Buffer.alloc(4 + data.length)
  buffer.writeUInt32BE(data.length, 0)
  data.copy(buffer, 4)
  return buffer
}

export function decode(buffer: Buffer) {
  const length = buffer.readUInt32BE(0)
  const data = buffer.subarray(4, 4 + length)
  return JSON.parse(data.toString())
}
