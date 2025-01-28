import { expose } from '@kunkun/api/runtime/deno';
import type { DenoAPI } from '../src/api.types.ts';
import { Bucket } from './bucket.ts';

expose(new Bucket() satisfies DenoAPI);
