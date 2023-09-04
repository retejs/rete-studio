import React from 'react'
import styled from 'styled-components'
import { DeliveredProcedureOutlined } from '@ant-design/icons'
import { Button, Tooltip, message } from 'antd';

const CopyButton = styled(Button)`
  position: absolute !important;
  bottom: 1em;
  right: 1em;
  z-index: 20;
`

export function CopyCode(props: { value: string }) {
  const [messageApi, contextHolder] = message.useMessage({ top: 60 });

  return (
    <>
      {contextHolder}
      <Tooltip placement="top" title="Copy executable code">
        <CopyButton
          onClick={() => {
            navigator.clipboard.writeText(props.value)
            messageApi.info('Copied to clipboard')
          }}
          icon={<DeliveredProcedureOutlined />}
        />
      </Tooltip>
    </>
  )
}
