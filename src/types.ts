export type Trade = {id:string;date:string;symbol:string;direction:'Long'|'Short';status:'Closed'|'Open';entry:number;exit:number|null;stop:number|null;target:number|null;quantity:number;multiplier:number;fees:number;manualNet:number|null;setup:string;strategy:string;emotion:string;rules:boolean;notes:string;accountId:string;createdAt:string};
export type Account = {id:string;name:string;currency:string;balance:number;broker?:string;accountType?:string;startDate?:string};
export type Review = {date:string;plan:string;review:string;lesson:string;updatedAt?:string};
export type AppState = {version:number;trades:Trade[];accounts:Account[];reviews:Review[];settings:{theme:'light'|'dark';currency:string;dailyLossLimit:number};lastBackup:string|null};
