import assert from 'node:assert/strict';
import test from 'node:test';
import {cartPreview, matchingQuote} from '../lib/cart-preview.ts';
const product={id:'rose',name:'Rose',image:'/images/roses.jpg',price:10000,category:'Roses',color:'Pink',available:true};
const quote={items:[{product,quantity:1,lineTotal:10000}],total:10000,currency:'KZT'};
test('cart preview follows current quantities and removal while using cached product details',()=>{
  const rows=cartPreview({rose:3},quote);
  assert.equal(rows[0].quantity,3);
  assert.equal(rows[0].product.name,'Rose');
  assert.deepEqual(cartPreview({},quote),[]);
  assert.equal(cartPreview({tulip:1},quote)[0].product,null);
});
test('checkout quote must match all current items and quantities',()=>{
  assert.equal(matchingQuote({rose:1},quote),true);
  assert.equal(matchingQuote({rose:2},quote),false);
  assert.equal(matchingQuote({rose:1,tulip:1},quote),false);
  assert.equal(matchingQuote({},quote),false);
});
test('malformed device cache cannot supply a displayed price',()=>{
  for(const cache of [null,{}, {items:[null]}, {items:[{product:{id:'rose',name:'Rose',image:'',price:'100'}}]}])
    assert.equal(cartPreview({rose:1},cache)[0].product,null);
});
