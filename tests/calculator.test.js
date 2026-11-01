import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate,createCalculator,keyToInput} from '../app/calculator.js';
test('four arithmetic operations and decimal rounding',()=>{
 assert.equal(calculate(7,'+',5),12);assert.equal(calculate(7,'-',5),2);
 assert.equal(calculate(7,'*',5),35);assert.equal(calculate(7,'/',2),3.5);
 assert.equal(calculate(.1,'+',.2),.3);
});
test('rejects zero division, invalid and overflowing numbers',()=>{
 assert.throws(()=>calculate(1,'/',0),/zero/);assert.throws(()=>calculate(Infinity,'+',1),/valid/);
 assert.throws(()=>calculate(1e308,'*',1e308),/large/);
});
test('input, chained calculation and recovery after error',()=>{
 const c=createCalculator();['1','2','+','3','='].forEach(c.input);assert.equal(c.display,'15');
 ['*','2','='].forEach(c.input);assert.equal(c.display,'30');
 ['/','0','='].forEach(c.input);assert.match(c.display,/zero/);
 c.input('4');assert.equal(c.display,'4');
});
test('decimal input, deletion, sign, operator replacement and clear',()=>{
 const c=createCalculator();['.','5','.','2','backspace'].forEach(c.input);assert.equal(c.display,'0.5');
 c.input('sign');assert.equal(c.display,'-0.5');
 ['+','*','2','='].forEach(c.input);assert.equal(c.display,'-1');
 c.input('clear');assert.equal(c.display,'0');assert.equal(c.operation,null);
});
test('keyboard controls use the same calculation state machine',()=>{
 const c=createCalculator();
 for(const key of ['1','2','+','3','Enter'])c.input(keyToInput(key));
 assert.equal(c.display,'15');
 c.input(keyToInput('Escape'));assert.equal(c.display,'0');
 c.input('9');c.input(keyToInput('Delete'));assert.equal(c.display,'0');
 assert.equal(keyToInput('Backspace'),'backspace');
 assert.equal(keyToInput('Tab'),null);assert.equal(keyToInput('F5'),null);
});
