addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const VALID_PATH = "/xxxxx"
const VALID_KEY = "token"
const VALID_VAL = "114514"

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
      const ip = await getGcoreIP();
      
      const allResultsFutrue = allTasks.map(async task => {
          const headers = { "Content-Type" : "application/json", Authorization: `Bearer ${task.api_bear_token}`}
          const data = { type:"A",name : task.domain, "content": ip,"proxied":false }
          const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${task.zone_id}/dns_records`, {
              method: 'POST',
              headers,
              body: JSON.stringify(data),
          });
          const result = await response.json();
          return result
      })
      const r = await Promise.all(allResultsFutrue);
      return new Response(JSON.stringify(r), { status: 200, headers: { "Content-Type": "application/json" } });
  }catch(error){
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

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
