import type {AppState,Trade} from './types';
const LEGACY_KEY='tradewise-journal-v1';
let KEY=LEGACY_KEY;
export function setStorageUser(email:string){KEY=`${LEGACY_KEY}:user:${encodeURIComponent(email.trim().toLowerCase())}`;}
export function hasUserStorage(){return localStorage.getItem(KEY)!==null;}
export function loadLegacy(){return parseState(localStorage.getItem(LEGACY_KEY));}
export const initial:AppState={version:1,trades:[],accounts:[{id:'default',name:'Personal account',currency:'USD',balance:10000}],reviews:[],settings:{theme:'light',currency:'USD',dailyLossLimit:0},lastBackup:null};
export function load():AppState{return parseState(localStorage.getItem(KEY));}
function parseState(raw:string|null):AppState{try{if(!raw)return initial;const x=JSON.parse(raw);if(x?.version!==1||!Array.isArray(x.trades)||!Array.isArray(x.accounts))return initial;return {...initial,...x,trades:x.trades.filter((t:unknown)=>validTrade(t)),accounts:x.accounts,reviews:Array.isArray(x.reviews)?x.reviews:[]};}catch{return initial;}}
function validTrade(x:unknown):x is Trade{if(!x||typeof x!=='object')return false;const t=x as Partial<Trade>;return typeof t.id==='string'&&typeof t.date==='string'&&typeof t.symbol==='string'&&(t.direction==='Long'||t.direction==='Short')&&(t.status==='Open'||t.status==='Closed')&&Number.isFinite(t.entry)&&Number.isFinite(t.quantity);}
export function save(s:AppState){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
export function backup(s:AppState){return JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),application:'TradeWise Journal',...s},null,2);}
export function restore(text:string):AppState{const x=JSON.parse(text);if(x.schemaVersion!==1||!Array.isArray(x.trades)||!Array.isArray(x.accounts))throw new Error('This file is not a supported TradeWise backup.');const trades=x.trades.filter(validTrade);return {...initial,...x,trades,reviews:Array.isArray(x.reviews)?x.reviews:[]};}
