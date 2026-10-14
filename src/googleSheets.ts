import type {AppState,Trade} from './types';

export type SheetsConfig={clientId:string;spreadsheetId:string};
const CONFIG_KEY='tradewise-google-sheets-config';
export const DEFAULT_CLIENT_ID='306608245311-3lj89fh4kuneg7rpt3kt31ciutbs3uqn.apps.googleusercontent.com';
const TAB='TradeWiseData';
let accessToken:string|null=null;
let tokenClient:{requestAccessToken:(opts:{prompt?:string})=>void}|null=null;
export function clearGoogleAuthorization(){accessToken=null;tokenClient=null;}

export function readSheetsConfig():SheetsConfig{try{const config=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');return {clientId:typeof config.clientId==='string'&&config.clientId?config.clientId:DEFAULT_CLIENT_ID,spreadsheetId:typeof config.spreadsheetId==='string'?config.spreadsheetId:''};}catch{return {clientId:DEFAULT_CLIENT_ID,spreadsheetId:''}}}
export function saveSheetsConfig(config:SheetsConfig){localStorage.setItem(CONFIG_KEY,JSON.stringify(config));}
function loadGoogleIdentity(){return new Promise<void>((resolve,reject)=>{if((window as any).google?.accounts?.oauth2){resolve();return;}const existing=document.querySelector<HTMLScriptElement>('script[data-google-identity]');if(existing){existing.addEventListener('load',()=>resolve(),{once:true});existing.addEventListener('error',()=>reject(new Error('Could not load Google sign-in. Check your internet connection.')),{once:true});return;}const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.dataset.googleIdentity='true';script.onload=()=>resolve();script.onerror=()=>reject(new Error('Could not load Google sign-in. Check your internet connection.'));document.head.append(script);});}
export async function authorizeSheets(clientId:string,forceConsent=false){await loadGoogleIdentity();if(!(window as any).google?.accounts?.oauth2)throw new Error('Google authorization did not load.');accessToken=null;await new Promise<void>((resolve,reject)=>{tokenClient=(window as any).google.accounts.oauth2.initTokenClient({client_id:clientId,scope:'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',callback:(response:{access_token?:string;error?:string;error_description?:string})=>{if(response.error||!response.access_token){reject(new Error(response.error_description||response.error||'Google authorization was cancelled.'));return;}accessToken=response.access_token;resolve();},error_callback:(error:{message?:string})=>reject(new Error(error.message||'Google authorization failed.'))});tokenClient!.requestAccessToken({prompt:forceConsent?'consent select_account':''});});}
export async function getGoogleUser():Promise<{email:string;name?:string;picture?:string}>{if(!accessToken)throw new Error('Sign in to Google first.');const response=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${accessToken}`}});if(!response.ok)throw new Error('Could not read the signed-in Google account.');const user=await response.json();if(!user.email||user.email_verified!==true)throw new Error('Google did not return a verified email address.');return {email:String(user.email),name:user.name,picture:user.picture};}
async function api(path:string,init:RequestInit={}){if(!accessToken)throw new Error('Connect to Google Sheets first.');const response=await fetch(`https://sheets.googleapis.com/v4/${path}`,{...init,headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',...init.headers}});if(!response.ok){let message=`Google Sheets request failed (${response.status}).`;try{const body=await response.json();message=body.error?.message||message;}catch{}throw new Error(message);}return response.status===204?null:response.json();}
async function drive(path:string,init:RequestInit={}){if(!accessToken)throw new Error('Sign in to Google first.');const response=await fetch(`https://www.googleapis.com/drive/v3/${path}`,{...init,headers:{Authorization:`Bearer ${accessToken}`,...init.headers}});if(!response.ok){let message=`Google Drive request failed (${response.status}).`;try{const body=await response.json();message=body.error?.message||message;}catch{}throw new Error(message);}return response.status===204?null:response.json();}
async function saveJournalLink(spreadsheetId:string,configFileId?:string){
  const body=JSON.stringify({spreadsheetId});
  const url=configFileId
    ?`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(configFileId)}?uploadType=media`
    :'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
  const boundary=`tradewise_${crypto.randomUUID().replaceAll('-','')}`;
  const payload=configFileId?body:`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:'tradewise-journal-config.json',mimeType:'application/json',parents:['appDataFolder']})}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const response=await fetch(url,{method:configFileId?'PATCH':'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':configFileId?'application/json':`multipart/related; boundary=${boundary}`},body:payload});
  if(!response.ok){let message='Could not save the journal link in Google Drive app data.';try{message=(await response.json()).error?.message||message;}catch{}throw new Error(message);}
}
export async function getOrCreateJournalSpreadsheet():Promise<string>{
  const query=new URLSearchParams({spaces:'appDataFolder',q:"name='tradewise-journal-config.json'",fields:'files(id,name)',pageSize:'10'});
  const found=await drive(`files?${query.toString()}`) as {files?:{id:string}[]};
  const configFileId=found.files?.[0]?.id;
  let spreadsheetId='';
  if(configFileId){
    const response=await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(configFileId)}?alt=media`,{headers:{Authorization:`Bearer ${accessToken}`}});
    if(!response.ok)throw new Error('Could not read Trading Journal app configuration from Google Drive.');
    const config=await response.json();
    if(typeof config.spreadsheetId==='string'&&config.spreadsheetId){
      try{
        const metadata=await api(`spreadsheets/${encodeURIComponent(config.spreadsheetId)}?fields=properties.title`) as {properties?:{title?:string}};
        spreadsheetId=config.spreadsheetId;
        if(metadata.properties?.title!=='Trading Journal')await api(`spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,{method:'POST',body:JSON.stringify({requests:[{updateSpreadsheetProperties:{properties:{title:'Trading Journal'},fields:'title'}}]})});
      }catch(error){
        // A deleted sheet is reported as 404 / "Requested entity was not found".
        // Keep permission, network and API errors visible instead of masking them.
        if(!(error instanceof Error)||!/(404|not found|requested entity was not found)/i.test(error.message))throw error;
      }
    }
  }
  if(!spreadsheetId){
    const created=await api('spreadsheets',{method:'POST',body:JSON.stringify({properties:{title:'Trading Journal'},sheets:[{properties:{title:TAB}}]})}) as {spreadsheetId:string};
    if(!created.spreadsheetId)throw new Error('Google did not return a spreadsheet ID.');
    spreadsheetId=created.spreadsheetId;
    await saveJournalLink(spreadsheetId,configFileId);
  }
  return spreadsheetId;
}
async function ensureTab(spreadsheetId:string){const id=encodeURIComponent(spreadsheetId);const info=await api(`spreadsheets/${id}?fields=sheets.properties(sheetId,title)`);if(!(info.sheets||[]).some((s:{properties:{title:string}})=>s.properties.title===TAB)){await api(`spreadsheets/${id}:batchUpdate`,{method:'POST',body:JSON.stringify({requests:[{addSheet:{properties:{title:TAB}}}]})});}}
function stateRows(state:AppState){const rows:string[][]=[['kind','id','json'],['meta','state',JSON.stringify({version:state.version,settings:state.settings,lastBackup:state.lastBackup})],...state.accounts.map(a=>['account',a.id,JSON.stringify(a)]),...state.trades.map(t=>['trade',t.id,JSON.stringify(t)]),...state.reviews.map(r=>['review',r.date,JSON.stringify(r)])];return rows;}
export async function readCloudState(spreadsheetId:string):Promise<AppState|null>{await ensureTab(spreadsheetId);const id=encodeURIComponent(spreadsheetId),range=encodeURIComponent(`${TAB}!A1:C`);const data=await api(`spreadsheets/${id}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`);const rows=(data.values||[]) as string[][];if(rows.length<2)return null;let meta:any=null;const accounts:any[]=[],trades:Trade[]=[],reviews:any[]=[];for(const row of rows.slice(1)){try{const value=JSON.parse(String(row[2]??''));if(row[0]==='meta'&&row[1]==='state')meta=value;else if(row[0]==='account')accounts.push(value);else if(row[0]==='trade'&&validTrade(value))trades.push(value);else if(row[0]==='review'&&value?.date)reviews.push(value);}catch{/* Ignore a malformed row without losing the other records. */}}if(!meta)return null;return {version:1,trades,accounts,reviews,settings:{theme:meta.settings?.theme==='dark'?'dark':'light',currency:typeof meta.settings?.currency==='string'?meta.settings.currency:'USD',dailyLossLimit:Number(meta.settings?.dailyLossLimit)||0},lastBackup:meta.lastBackup??null};}
function validTrade(x:any):x is Trade{return !!x&&typeof x.id==='string'&&typeof x.date==='string'&&typeof x.symbol==='string'&&(x.direction==='Long'||x.direction==='Short')&&(x.status==='Open'||x.status==='Closed')&&Number.isFinite(x.entry)&&Number.isFinite(x.quantity);}
export async function writeCloudState(spreadsheetId:string,state:AppState){await ensureTab(spreadsheetId);const id=encodeURIComponent(spreadsheetId),range=encodeURIComponent(`${TAB}!A:C`);await api(`spreadsheets/${id}/values/${range}:clear`,{method:'POST',body:JSON.stringify({})});await api(`spreadsheets/${id}/values/${encodeURIComponent(`${TAB}!A1`)}?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({majorDimension:'ROWS',values:stateRows(state)})});}
