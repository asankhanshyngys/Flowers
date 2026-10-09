import {randomUUID} from 'node:crypto';
import type {SqlDatabase} from './sqlite.ts';
import type {StoreLocation} from '../lib/locations.ts';
import {object, text, boolean, integer, HttpError} from './validation.ts';
export function locationInput(value: unknown, creating: boolean) {
  const v=object(value,['name','address','phone','hours','mapUrl','active','displayOrder',...(creating ? [] : ['version'])]);
  const mapUrl=text(v.mapUrl,'Ссылка 2ГИС',2048,true);
  if(mapUrl) {
    let valid=false;
    try {const u=new URL(mapUrl); valid=u.protocol==='https:' && ['2gis.kz','2gis.ru','2gis.com','go.2gis.com'].includes(u.hostname) && !u.username && !u.password && !u.port;} catch {}
    if(!valid) throw new HttpError(400,'invalid_map','Укажите HTTPS-ссылку на 2ГИС.');
  }
  const phone=text(v.phone,'Телефон',40,true);
  if(phone && !/^\+?[\d ()-]{5,40}$/.test(phone)) throw new HttpError(400,'invalid_phone','Проверьте номер телефона.');
  return {name:text(v.name,'Название',120),address:text(v.address,'Адрес',300),phone,hours:text(v.hours,'Часы работы',160,true),mapUrl,active:Number(boolean(v.active,'Показывать на сайте')),displayOrder:integer(v.displayOrder,'Порядок',1000000),version:creating ? 0 : integer(v.version,'Версия',1000000,1)};
}
const columns='id,name,address,phone,hours,map_url AS mapUrl,active,display_order AS displayOrder,version';
export async function listLocations(db: SqlDatabase, admin=false) {
  return (await db.prepare(`SELECT ${columns} FROM store_locations ${admin ? '' : 'WHERE active=1'} ORDER BY display_order,id`).all<StoreLocation>()).results;
}
export async function saveLocation(db: SqlDatabase, input: ReturnType<typeof locationInput>, id?: string) {
  const values=[input.name,input.address,input.phone,input.hours,input.mapUrl,input.active,input.displayOrder];
  if(id) {
    const result=await db.prepare('UPDATE store_locations SET name=?,address=?,phone=?,hours=?,map_url=?,active=?,display_order=?,version=version+1 WHERE id=? AND version=?').bind(...values,id,input.version).run();
    if(!result.meta.changes) throw new HttpError(409,'conflict','Адрес изменился. Обновите список и откройте его снова.');
  } else {
    id=randomUUID();
    await db.prepare('INSERT INTO store_locations (name,address,phone,hours,map_url,active,display_order,id) VALUES (?,?,?,?,?,?,?,?)').bind(...values,id).run();
  }
  return {id};
}
