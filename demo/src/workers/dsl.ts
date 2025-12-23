import { createAdapter } from 'rete-studio-core'
import * as DSL from 'rete-studio-dsl-lang'
import { responsable } from 'worker-bridge'

responsable(createAdapter(DSL))
