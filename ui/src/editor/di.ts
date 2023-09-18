import { NodeEditor } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'
import { Schemes, InputControl, InsertControl, SelectControl } from 'rete-studio-core'
import { AreaExtra } from '.'

export function applyDI(editor: NodeEditor<Schemes>, area: AreaPlugin<Schemes, AreaExtra>) {
	for (const node of editor.getNodes()) {
		[
			...Object.values(node.controls),
			...Object.values(node.inputs).map(inp => inp?.control),
			...Object.values(node.outputs).map(out => out?.control)
		].forEach(control => {
			if (control instanceof InputControl || control instanceof InsertControl || control instanceof SelectControl) {
				control.node = node
			}
			if (control instanceof InsertControl) {
				control.onUpdateNode = () => control.node && area.update('node', control.node.id)
			}
		})
	}
}
