

+ 需要添加环境变量`TASKS`  
最好压缩为一行。

```json
[{
	"domain": "example.com",
	"zone_id": "11122233",
	"api_bear_token": "***"
}]
```

+ 通过HTTP API触发任务  
默认合法请求为 `/xxxxx?token=114514&ip=1.1.1.1`  
如果传入ip为空，那么设置的值为从GitHub repo获取。  
可根据需要修改代码或者配置同名环境变量。
```js
// `${VALID_PATH}?${VALID_KEY}=${VALID_VAL}`
const VALID_PATH = "/xxxxx"
const VALID_KEY = "token"
const VALID_VAL = "114514"
```