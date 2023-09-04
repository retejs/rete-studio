import { flatExamples, File, Folder } from '../../languages/_utils'

export { flatExamples }

import { examples as jsExamples } from '../../languages/javascript'
import { examples as debugExamples } from '../../languages/debug'

export type ExampleItem = File | Folder

export const examplesMap: Record<string, ExampleItem[]> = {
  javascript: jsExamples,
  debug: debugExamples
}
