export async function github(path:string,method='GET',body?:unknown):Promise<{status:number;data:unknown}>{
 const token=process.env.GITHUB_TOKEN
 if(!token)throw Error('GITHUB_TOKEN missing')
 const resp=await fetch('https://api.github.com'+path,{
  method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)
 })
 const data=resp.status===204?null:await resp.json()
 return {status:resp.status,data}
}

