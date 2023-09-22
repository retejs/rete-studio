import { ClassicPreset } from 'rete'
import { socket, Socket } from './sockets'
import { InputType } from './nodes'
export { socket, Socket }

export class Control extends ClassicPreset.Control {
	serialize(): JSONControl {
		return {
			id: this.id,
			index: this.index
		}
	}
}

type ControlAction = string | [string, object]
interface Interactive {
	action: ControlAction
}

export type JSONControl = {
	id: string
	index?: number
}

export class InsertControl extends Control implements Interactive {
	public action: ControlAction
	public onClick?: (control: InsertControl) => void

	constructor(options: { action: ControlAction, onClick?: (control: InsertControl) => void }) {
		super()
		this.action = options.action
		this.onClick = options.onClick
	}

	clone() {
		return new InsertControl({
			action: this.action,
			onClick: this.onClick
		})
	}

	serialize(): JSONInsertControl {
		return {
			isInsertControl: true,
			action: this.action,
			...super.serialize()
		}
	}

	static deserialize(data: JSONInsertControl) {
		const control = new InsertControl({ action: data.action })

		control.id = data.id
		control.index = data.index

		return control
	}
}

export type JSONInsertControl = JSONControl & Interactive & {
	isInsertControl: true
	action: ControlAction
}

type SelectOption = { value: string, label: string }
type SelectChange = (value: string, control: SelectControl) => void

export class SelectControl extends Control implements Interactive {
	action: ControlAction
	value: string
	options: SelectOption[]
	onChange?: SelectChange

	constructor(props: { action: ControlAction, value: string, options: SelectOption[], onChange?: SelectChange }) {
		super()
		this.action = props.action
		this.value = props.value
		this.options = props.options
		this.onChange = props.onChange
	}

	change(key: string) {
		this.value = key
		if (this.onChange) this.onChange(key, this)
	}

	clone() {
		return new SelectControl({
			action: this.action,
			value: this.value,
			options: this.options,
			onChange: this.onChange
		})
	}

	serialize(): JSONSelectControl {
		return {
			...super.serialize(),
			action: this.action,
			isSelectControl: true,
			value: this.value,
			options: this.options,
		}
	}

	static deserialize(data: JSONSelectControl) {
		const control = new SelectControl({
			action: data.action,
			value: data.value,
			options: data.options
		})

		control.id = data.id
		control.index = data.index

		return control
	}
}

export type JSONSelectControl = JSONControl & Interactive & {
	isSelectControl: true
	value: string
	options: SelectOption[]
}

export class InputControl extends ClassicPreset.InputControl<'text' | 'number'> implements Interactive {
	action: ControlAction

	constructor(public options: {
		action: ControlAction
		type: InputType,
		readonly?: boolean
		initial?: string | number
		onChange?: (value?: string | number) => void
		allowedTypes?: InputType[]
	}) {
		super('text', options)
		this.action = options.action
	}

	setValue(value?: string | number | undefined): void {
		const type = this.options?.type
		const val = type === 'number' && typeof value !== 'undefined' ? +value : value

		super.setValue(val)
		if (this.options.onChange) this.options.onChange(val)
	}

	clone() {
		return new InputControl({
			action: this.action,
			type: this.options?.type || 'text',
			readonly: this.readonly,
			initial: this.value,
			allowedTypes: this.options?.allowedTypes ? [...this.options.allowedTypes] : undefined,
			onChange: this.options.onChange
		})
	}

	serialize(): JSONInputControl {
		return {
			isInputControl: true,
			action: this.action,
			id: this.id,
			index: this.index,
			readonly: this.readonly,
			type: this.options?.type || 'text',
			value: this.value,
			allowedTypes: this.options?.allowedTypes
		}
	}

	static deserialize(data: JSONInputControl) {
		const control = new InputControl({
			action: data.action,
			type: data.type,
			readonly: data.readonly,
			initial: data.value,
			allowedTypes: data.allowedTypes
		})

		return control
	}
}

export type JSONInputControl = JSONControl & Interactive & {
	isInputControl: true
	readonly: boolean
	type: InputType
	value?: string | number
	allowedTypes?: InputType[]
}
