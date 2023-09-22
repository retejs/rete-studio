import { NodeEditor, getUID } from 'rete'
import { Schemes } from './types'
import { Input, Output, BaseNode } from './nodes'
import { InputControl, InsertControl, SelectControl } from './controls'
import { RefSocket, socket } from './sockets'

function applyOutputIdentifierControl(control: InputControl, activeNode: BaseNode, data: { key: string }) {
	control.options.onChange = (value) => {
		(activeNode.outputs[data.key]!.socket as RefSocket).identifier = String(value)
	}
}

function applyDataKey(control: InputControl, activeNode: BaseNode, data: { key: string }) {
	control.options.onChange = (value) => {
		activeNode.data[data.key] = value
	}
}

function applySelectVarKind(control: SelectControl, activeNode: BaseNode) {
	control.onChange = (value) => {
		activeNode.data.kind = value
	}
}
function applySelectUpdatePrefix(control: SelectControl, activeNode: BaseNode) {
	control.onChange = (value) => {
		activeNode.data.prefix = (value === 'prefix') as any
	}
}


function applyInsertHandler(control: InsertControl, activeNode: BaseNode, update: (nodeId: string) => void, data: { key: string, side: 'input' | 'output', needControl?: boolean }) {
	const { key, side, needControl } = data

	control.onClick = () => {
		const list = side === 'input' ? activeNode.inputs : activeNode.outputs
		const index = Object.keys(list).filter(k => k.startsWith(key)).length
		const arrayKey = `${key}[${index}]`

		if (side === 'input') {
			const input = new Input(socket, arrayKey, true)

			if (needControl && !input.control) {
				const control = new InputControl({ action: 'change-identifier', type: 'text' })

				input.control = control
			}

			activeNode.addInput(arrayKey, input)
		} else {
			const identifier = `arg${getUID()}`
			const output = new Output(new RefSocket('Reference', identifier), arrayKey, true)

			if (needControl && !output.control) {
				const control = new InputControl({ // TODO
					action: ['change-output-identifier', { key }],
					type: 'identifier',
					initial: identifier,
					allowedTypes: ['identifier']
				})

				applyOutputIdentifierControl(control, activeNode, { key })

				output.control = control
			}
			activeNode.addOutput(arrayKey, output)
		}
		activeNode.updateSize()
		update(activeNode.id)
	}
}


export function applyInteraction(editor: NodeEditor<Schemes>, update: (nodeId: string) => void) {
	for (const node of editor.getNodes()) {
		[
			...Object.values(node.controls).map(control => [node, control] as const),
			...Object.values(node.inputs).map(inp => [node, inp?.control] as const),
			...Object.values(node.outputs).map(out => [node, out?.control] as const)
		].forEach(([activeNode, control]) => {
			if (control instanceof InsertControl && control.action[0] === 'insert') {
				applyInsertHandler(control, activeNode, update, control.action[1] as { key: string, side: 'input' | 'output', needControl?: boolean })
			}
			if (control instanceof InputControl && control.action[0] === 'change-output-identifier') {
				applyOutputIdentifierControl(control, activeNode, control.action[1] as { key: string })
			}
			if (control instanceof InputControl && control.action[0] === 'change-key-text') {
				applyDataKey(control, activeNode, control.action[1] as { key: string })
			}
			if (control instanceof SelectControl && control.action === 'select-var-kind') {
				applySelectVarKind(control, activeNode)
			}
			if (control instanceof SelectControl && control.action === 'select-update-prefix') {
				applySelectUpdatePrefix(control, activeNode)
			}
		})
	}
}
