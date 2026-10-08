import 'server-only';
import { cache } from 'react';
import { database } from './db';
import { productDetail } from './catalog-service';
// React cache deduplicates metadata + page reads in the same request only.
export const getProduct = cache((id: string) => productDetail(database(), id));
