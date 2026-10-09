import {database} from '@/server/db';
import {saveLocation,locationInput} from '@/server/locations';
import {requireAdmin,requireMutationOrigin} from '@/server/auth';
import {respond,jsonBody} from '@/server/http';
export function PUT(request:Request,context:{params:Promise<{id:string}>}){return respond(async()=>{await requireAdmin();requireMutationOrigin(request);return saveLocation(database(),locationInput(await jsonBody(request),false),(await context.params).id);});}
