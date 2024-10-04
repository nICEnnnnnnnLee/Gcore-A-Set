addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const VALID_PATH = this.VALID_PATH || "/xxxxx"
const VALID_KEY = this.VALID_KEY || "token"
const VALID_VAL = this.VALID_VAL || "114514"

async function handleRequest(request) {
  // TASKS = "[{\"domain\":\"example.com\",\"zone_id\":\"11122233\",\"api_bear_token\":\" ***  \"}]"
  
  try{
      const url = new URL(request.url)
      const path = url.pathname
      const token = url.searchParams.get(VALID_KEY)
      if( path !== VALID_PATH || token !== VALID_VAL){
          return new Response(JSON.stringify({ error: "No auth", path, token }), { status: 403, headers: { "Content-Type": "application/json" } });
      }
      const allTasks = JSON.parse(this.TASKS || '[]')
      const ip = url.searchParams.get("ip") || await getGcoreIP();
      
      const allResultsFutrue = allTasks.map(async task => {
          const headers = { "Content-Type" : "application/json", Authorization: `Bearer ${task.api_bear_token}`}
          
          // 先查询有没有A记录
          const queryRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${task.zone_id}/dns_records?name=${task.domain}&type=A,CNAME`, { headers });
          const queryResult = await queryRes.json();
          // 如果含有记录，且记录大于1
          const records = queryResult.result
          const rlength = records.length 
          if(rlength > 1){
              // 删除记录，仅剩最后一个
              const rDelete = await Promise.all( records.slice(0, rlength-1).map( record => deleteA(task, record, headers)  ) )
              // console.log("delete result: ", rDelete)
              // 更新记录
              return updateA(task, ip, headers, records[rlength-1])
          } else if(rlength == 1){
              //console.log("update record only")
              return updateA(task, ip, headers, records[0])
          } else {
              //console.log("create record only", rlength)
              return createA(task, ip, headers)
          }
      })
      const r = await Promise.all(allResultsFutrue);
      return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
  }catch(error){
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

}

async function deleteA(task, oldRecord, headers){
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${task.zone_id}/dns_records/${oldRecord.id}`, { method: 'DELETE', headers, });
    return response.json();
}

async function updateA(task, ip, headers, oldRecord){
    const data = { ...oldRecord, type:"A",name : task.domain, "content": ip,"proxied":false }
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${task.zone_id}/dns_records/${oldRecord.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
}

async function createA(task, ip, headers){
    const data = { type:"A",name : task.domain, "content": ip,"proxied":false }
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${task.zone_id}/dns_records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return response.json();
}

async function getGcoreIP(){
    return new Promise(async (resolve, reject) => {
        try{
            const response = await fetch("https://github.com/BruceWind/GcoreCDNIPSelector/blob/main/result.txt?raw=true");
              if (!response.ok) {
                  reject(new Error(`Fetch github result HTTP error! status: ${response.status}`))
                }
              const ips = await response.json();
              let idx = 0;
              let ipInfo = ips[idx];
              while(ipInfo.latency <= 0 && idx < ipInfo.length){
                  ipInfo = ips[++idx]
              }
              console.log(ipInfo)
              resolve(ipInfo.ip)
        } catch (err){
            reject(err)
        }
        
    })
}
