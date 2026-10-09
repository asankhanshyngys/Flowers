import test from 'node:test';
import assert from 'node:assert/strict';
import {locationMapUrl,pinMapUrl} from '../lib/location-map.ts';
test('map-only embed points at the store without a business-card widget',()=>{
 const url=new URL(locationMapUrl('https://2gis.kz/astana/firm/70000001067393553'));
 assert.equal(url.hostname,'www.openstreetmap.org');
 assert.equal(url.searchParams.get('marker'),'51.14245,71.420112');
 assert.equal(url.searchParams.get('layer'),'mapnik');
 assert.equal(new URL(pinMapUrl(43.25,76.95)).searchParams.get('marker'),'43.25,76.95');
});
test('unknown locations never inherit the example store coordinates',()=>{
 for(const link of ['', 'javascript:alert(1)','https://evil.test/astana/firm/123','https://2gis.kz/almaty/firm/123'])assert.equal(locationMapUrl(link),null);
 assert.equal(pinMapUrl(NaN,10),null);
 assert.equal(pinMapUrl(100,10),null);
 assert.equal(pinMapUrl(40,200),null);
});
