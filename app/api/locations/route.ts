import {database} from '@/server/db';
import {listLocations} from '@/server/locations';
import {respond} from '@/server/http';
export const dynamic='force-dynamic';
export function GET(){return respond(async()=>({locations:await listLocations(database())}));}
