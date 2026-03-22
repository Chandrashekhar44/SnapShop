
import express,{ Express}from "express"

const app:Express = express();

app.get('/',(req,res)=>{
    res.send("server is running")

})
export default app;