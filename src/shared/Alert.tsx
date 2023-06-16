import styled from 'styled-components';
import { Alert } from 'antd'

export const StyledAlert = styled(Alert)`
  position: absolute;
  bottom: 1em;
  z-index: 14;
`

export function CodeError(props: { message: string, placement: 'left' | 'right' }) {
  return <StyledAlert
    type='error'
    message={props.message}
    showIcon={true}
    style={props.placement === 'left' ? { left: '1em' } : { right: '1em' }}
  />
}
