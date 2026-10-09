import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {SqlDatabase} from '../server/sqlite.ts';
import {applyMigrations} from '../scripts/migrations.mjs';
import {locationInput,listLocations,saveLocation} from '../server/locations.ts';
const input={name:'Second shop',address:'Astana, test street',phone:'+7 777 123 45 67',hours:'10:00–20:00',mapUrl:'https://2gis.kz/astana/firm/123',active:true,displayOrder:2};
test('location creation, sorting, hiding, conflicts and repeat migrations preserve edits',async()=>{
 const client=createClient({url:'file::memory:'});const db=new SqlDatabase(client);
 try{
  await applyMigrations(client);
  const {id}=await saveLocation(db,locationInput(input,true));
  assert.equal((await listLocations(db)).length,2);
  assert.equal((await listLocations(db))[1].id,id);
  await saveLocation(db,locationInput({...input,active:false,version:1},false),id);
  assert.equal((await listLocations(db)).length,1);
  assert.equal((await listLocations(db,true)).length,2);
  await assert.rejects(saveLocation(db,locationInput({...input,version:1},false),id),e=>e.status===409);
  await saveLocation(db,locationInput({...input,displayOrder:0,version:2},false),id);
  await applyMigrations(client);
  assert.equal((await listLocations(db,true)).find(x=>x.id===id).version,3);
 }finally{client.close();}
});
test('location links reject executable URLs and deceptive domains',()=>{
 for(const mapUrl of ['javascript:alert(1)','https://2gis.kz.evil.test/x','https://user:pass@2gis.kz/x','http://2gis.kz/x'])
  assert.throws(()=>locationInput({...input,mapUrl},true));
 assert.throws(()=>locationInput({...input,displayOrder:-1},true));
 assert.throws(()=>locationInput({...input,active:'true'},true));
 assert.throws(()=>locationInput({...input,address:''},true));
 assert.equal(locationInput({...input,mapUrl:''},true).mapUrl,'');
});
