import ClientLayout from '@/app/client-layout';
import { Playground } from '../page';

export default function Page() {
  return (
    <ClientLayout headless={true}>
      <Playground />
    </ClientLayout>
  )
}
