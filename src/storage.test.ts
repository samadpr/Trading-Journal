import {describe,it,expect} from 'vitest';
import {backup,initial,restore} from './storage';
import type {Trade} from './types';
const item:Trade={id:'one',date:'2026-10-10',symbol:'EURUSD',direction:'Short',status:'Closed',entry:1.2,exit:1.1,stop:1.3,target:1,quantity:1,multiplier:1,fees:0,manualNet:null,setup:'',strategy:'',emotion:'',rules:true,notes:'note, with "quotes"',accountId:'default',createdAt:'2026-10-10T10:00:00Z'};
describe('local data interchange',()=>{it('round trips the versioned JSON backup',()=>{const s={...initial,trades:[item]},read=restore(backup(s));expect(read.trades[0]).toEqual(item);});it('rejects unsupported or malformed JSON',()=>{expect(()=>restore('{')).toThrow();expect(()=>restore('{"schemaVersion":99,"trades":[],"accounts":[]}')).toThrow();});});
