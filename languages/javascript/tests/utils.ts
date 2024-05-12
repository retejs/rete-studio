/* eslint-disable max-statements */

export type N = { id: string }
export type C = { sourceOutput: string, source: string, target: string, id: string }
export type Marker = { index: number, context: C }

export function comparable(s: string) {
  const data = getData(s)

  return [
    data.connections.map(c => c.id).sort().join('\n'),
    Object.entries(data.closures).map(([id, c]) => `${id}: ${Array.from(c).sort().join(',')}`).join('\n')
  ].join('\n---\n')
}

export function sanitize(s: string) {
  return s.trim().replace(/\n +/g, '\n')
}

function isConnection(line: string) {
  return line.includes('-->')
}

function parseConnection(line: string): C {
  const isRelation = line.match(/(.*) +-->\|(.*)\| +(.*)/)

  if (isRelation) {
    const [, source, sourceOutput, target] = isRelation

    return { source, sourceOutput, target, id: [source, sourceOutput, target].join('->') }
  }
  throw new Error('Invalid connection. It should be in the format "source -->|key| target"')
}

export function getData(s: string): { nodes: N[], connections: C[], closures: Record<string, Set<string>> } {
  const lines = s.replace(/^flowchart LR/, '').trim().split('\n')
  const connections: C[] = lines
    .filter(line => !line.startsWith('subgraph') && !line.startsWith('end'))
    .filter(isConnection)
    .map(parseConnection)
  const nodes = Array.from(new Set(connections.flatMap(({ source, target }) => [source, target]))).map((id) => ({ id }))

  const closures: Record<string, Set<string>> = {}
  const subgraphs: string[] = []

  for (const line of lines) {
    if (line.startsWith('subgraph')) {
      subgraphs.push(line.split(' ')[1])
    } else if (line.startsWith('end')) {
      subgraphs.pop()
    } else {
      const subgraph = subgraphs[subgraphs.length - 1]

      if (subgraph) {
        closures[subgraph] = closures[subgraph] || new Set()

        if (isConnection(line)) {
          const { source, target } = parseConnection(line)

          closures[subgraph].add(source)
          closures[subgraph].add(target)
        } else {
          closures[subgraph].add(line.trim())
        }
      }
    }
  }

  return { nodes, connections, closures }
}

export function stringifyMarkers(marker: Marker[]) {
  return marker.map(stringifyMarker).join(',') || 'null'
}

export function stringifyMarker(marker: Marker) {
  return `[${marker.index}]${marker.context.id}`
}

export function stringifyChart(connections: C[], closures: Record<string, Set<string>>) {
  // https://mermaid.live
  return sanitize(`
flowchart LR

${connections.map(c => `${c.source} -->|${c.sourceOutput}| ${c.target}`).join('\n')}

${Object.entries(closures).map(([id, nodes]) => {
    return `subgraph ${id}\n${Array.from(nodes).join('\n')}\nend`
  }).join('\n')}
`)
}
