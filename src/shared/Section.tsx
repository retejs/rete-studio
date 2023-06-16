import styled from 'styled-components'

const Container = styled.div`
  margin: 1.5em auto;
  max-width: 80em;
  .title {
    font-size: 1.5em;
    font-weight: 600;
    margin: 1rem 2rem;
    color: white;
  }
  .description {
    color: #c8c8c8;
    font-size: 1.2em;
    font-weight: 400;
    margin: 1rem 2rem;
  }
`

export function Section({ title, description, ...props }: { title: string, description: string }) {
  return (
    <Container {...props}>
      <p className='title'>{title}</p>
      <p className='description'>{description}</p>
    </Container>
  )
}
