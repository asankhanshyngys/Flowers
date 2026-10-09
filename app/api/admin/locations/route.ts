import {database} from '@/server/db';
import {listLocations,saveLocation,locationInput} from '@/server/locations';
import {requireAdmin,requireMutationOrigin} from '@/server/auth';
import {respond,jsonBody} from '@/server/http';
export const dynamic='force-dynamic';
export function GET(){return respond(async()=>{await requireAdmin();return {locations:await listLocations(database(),true)};});}
export function POST(request:Request){return respond(async()=>{await requireAdmin();requireMutationOrigin(request);return saveLocation(database(),locationInput(await jsonBody(request),true));},201);}
