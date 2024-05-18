import { createAdapter } from 'rete-studio-core'
import * as JavaScript from 'rete-studio-javascript-lang'
import { responsable } from 'worker-bridge'

responsable(createAdapter(JavaScript))
