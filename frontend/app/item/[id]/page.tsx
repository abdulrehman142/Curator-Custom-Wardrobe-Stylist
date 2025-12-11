import { Suspense } from 'react';
import ItemDetailClient from './ItemDetailClient';

export default function ItemDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItemDetailClient />
    </Suspense>
  );
}
