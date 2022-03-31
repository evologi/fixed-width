export function trimStart (value, pad) {
  let index = 0
  while (value[index] === pad) {
    index++
  }
  return value.substring(index)
}

export function trimEnd (value, pad) {
  let index = value.length - 1
  while (value[index] === pad) {
    index--
  }
  return value.substring(0, index + 1)
}

export function trim (value, pad) {
  return trimEnd(trimStart(value, pad), pad)
}

export function trimString (value, pad, mode) {
  switch (mode) {
    case false:
      return value
    case 'left':
      return trimStart(value, pad)
    case 'right':
      return trimEnd(value, pad)
    default:
      return trim(value, pad)
  }
}
