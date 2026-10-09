import test from 'node:test';
import assert from 'node:assert/strict';
import {locationMapUrl} from '../lib/location-map.ts';
test('2GIS map preserves firm location and suppresses the oversized card',()=>{
 const url=new URL(locationMapUrl('https://2gis.kz/astana/firm/70000001067393553'));
 const options=JSON.parse(url.searchParams.get('options'));
 assert.equal(options.org,'70000001067393553');
 assert.deepEqual(options.opt.card,[]);
 assert.equal(options.pos.lat,51.14245);
 const other=new URL(locationMapUrl('https://2gis.kz/almaty/firm/123'));
 const otherOptions=JSON.parse(other.searchParams.get('options'));
 assert.equal(otherOptions.opt.city,'almaty');
 assert.deepEqual(otherOptions.pos,{});
});
test('unrecognized map links never become iframe sources',()=>{
 for(const link of ['', 'javascript:alert(1)','https://evil.test/astana/firm/123','https://go.2gis.com/abc'])assert.equal(locationMapUrl(link),null);
});
