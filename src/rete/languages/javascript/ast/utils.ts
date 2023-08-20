import * as BabelType from '@babel/types'

export function getIdentifiers(v: BabelType.LVal) {
  const ids: BabelType.Identifier[] = []

  if (BabelType.isIdentifier(v)) {
    ids.push(v)
  } else if (BabelType.isArrayPattern(v)) {
    v.elements.forEach(el => el && ids.push(...getIdentifiers(el)))
  } else if (BabelType.isObjectPattern(v)) {
    v.properties.forEach(el => {
      if (BabelType.isRestElement(el)) ids.push(...getIdentifiers(el))
      else ids.push(...getIdentifiers(el.value as any))
    })
  } else if (BabelType.isRestElement(v)) {
    ids.push(...getIdentifiers(v.argument))
  } else {
    throw v.type
  }

  return ids
}
