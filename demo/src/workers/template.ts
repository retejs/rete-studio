import { createAdapter } from 'rete-studio-core'
import * as Template from 'rete-studio-template-lang'
import { responsable } from 'worker-bridge'

responsable(createAdapter(Template))
