import { RenderEmit, Presets } from 'rete-react-plugin'
import styled from 'styled-components'
import { Schemes } from '../types'

type NodeExtraData = { width?: number, height?: number }

const { RefSocket, RefControl } = Presets.classic;

function sortByIndex<T extends [string, undefined | { index?: number }][]>(entries: T) {
    entries.sort((a, b) => {
        const ai = a[1]?.index || 0
        const bi = b[1]?.index || 0

        return ai - bi
    })
}

export const selectedShadow = '0px 2px 6px 2px #985700, 0 0 0px 5px #c9b144;'

const NodeStyles = styled(Presets.classic.NodeStyles)`
    min-width: auto;
    /* outline: ${props => props.selected ? '4px solid #c9b144' : 'none'}; */
    border: 1px solid #000;
    border-radius: 20px;
    box-shadow: ${props => props.selected ? selectedShadow : '0 5px 5px 1px rgba(0,0,0,.3)'};
    background-color: hsla(0,0%,6%,.55);
    z-index: 1;
    .glossy {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-top: 1.5px solid #ffffffb3;
        border-radius: inherit;
        background: linear-gradient(180deg, rgb(255 255 255 / 25%) 0px, rgb(255 255 255 / 21%) 3px, rgb(255 255 255 / 14%) 6px, rgb(255 255 255 / 10%) 9px, rgb(255 255 255 / 10%) 13px, transparent 13px);
        z-index: -1;
    }
    .output, .input {
        display: flex;
        align-items: center;
    }
    .output {
        justify-content: flex-end;
    }
    .title {
        white-space: nowrap;
        background: radial-gradient(50% 90%,#3f80c39e 0%,transparent 80%);
        font-size: 20px;
        padding: 5px;
        border-radius: 15px 15px 0 0;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .title, .input-title, .output-title {
        font-family: 'Montserrat',sans-serif;
        font-weight: 300;
    }
    .input-title, .output-title {
        font-size: 14px;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .input-socket, .output-socket {
        position: relative;
        z-index: 5;
    }
    .input-socket {
        margin-left: 5px;// -15px;
    }
    .output-socket {
        margin-right: 5px;// -15px;
    }
    .input-control {
        overflow: hidden;
        padding: 2px;
    }

    .columns {
        display: flex;
        .column {
            overflow: hidden;
            flex: 1;
            flex-basis: content;
        }
    }
    ${props => props.styles ? props.styles(props) : ''}
` as any

type Props<S extends Schemes> = {
    data: S['Node'] & NodeExtraData
    styles?: () => any
    emit: RenderEmit<S>
}

export type NodeComponent<Scheme extends Schemes> = (props: Props<Scheme>) => JSX.Element

export function Node<Scheme extends Schemes>(props: Props<Scheme>) {
    const inputs = Object.entries(props.data.inputs)
    const outputs = Object.entries(props.data.outputs)
    const controls = Object.entries(props.data.controls)
    const selected = props.data.selected || false

    sortByIndex(inputs)
    sortByIndex(outputs)
    sortByIndex(controls)

    return (
        <NodeStyles selected={selected} width={props.data.width} height={props.data.height} styles={props.styles}>
            {/* <div style={{ position: 'absolute', top: '-1em', right: '1em' }}>{props.data.id}</div> */}
            <div className="glossy"></div>
            <div className="title">{props.data.label}</div>
            <div className='columns'>
                <div className='column'>
                    {/* Inputs */}
                    {inputs.map(([key, input]) => (
                        input && <div className="input" key={key}>
                            <RefSocket
                                name="input-socket"
                                side="input"
                                socketKey={key}
                                nodeId={props.data.id}
                                emit={props.emit}
                                payload={input.socket}
                                data-testid="input-socket"
                            />
                            {input && (!input.control || !input.showControl) && <div className="input-title">{input?.label}</div>}
                            {input?.control && input?.showControl && (
                                <RefControl
                                    key={key}
                                    name="input-control"
                                    emit={props.emit}
                                    payload={input.control}
                                    data-testid="input-control"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className='column'>
                    {/* Outputs */}
                    {outputs.map(([key, output]) => (
                        output && <div className="output" key={key}>
                            {!output?.control && <div className="output-title">{output?.label}</div>}
                            {output?.control && (
                                <RefControl
                                    key={key}
                                    name="output-control"
                                    emit={props.emit}
                                    payload={output.control}
                                    data-testid="output-control"
                                />
                            )}
                            <RefSocket
                                name="output-socket"
                                side="output"
                                socketKey={key}
                                nodeId={props.data.id}
                                emit={props.emit}
                                payload={output.socket}
                                data-testid="output-socket"
                            />
                        </div>
                    ))}
                </div>
            </div>
            {/* Controls */}
            <div className="controls">
                {controls.map(([key, control]) => {
                    return control ? (
                        <RefControl
                            key={key}
                            name="control"
                            emit={props.emit}
                            payload={control}
                            data-testid={`control-${key}`}
                        />
                    ) : null;
                })}
            </div>
        </NodeStyles>
    )
}
