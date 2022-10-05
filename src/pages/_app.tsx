import '../styles/globals.scss'
import "normalize.css"
import cookies from "cookie"
import { AppContext } from 'next/app'
import Head from "next/head"
function MyApp({ Component, pageProps }:any) {
  return <>
      <Head>
        <title>IPDrop | Local file sharing</title>
        <meta name="description" content="IPDrop is a free online service for sharing files and links with people in your local network" />
        <meta name="author" content='Casey Allen (https://github.com/CaseyAllen)' />
        <meta name="keywords" content="filesharing, local, file, url, ip file, airdrop, ipdrop, share" />
      </Head>
  <Component {...pageProps} />
  </>
}
MyApp.getInitialProps = async(context:AppContext) =>{
  
  const req = context.ctx.req! 
  const res = context.ctx.res!
  
  const tok = cookies.parse(req.headers.cookie??"").token
  const host = req.headers.host
  if(!tok){
    // Create a new user
    try{
      const fres = await fetch("http://"+host+"/api/user", {
        method: "POST"
      })
      const text = await fres.text()
      const cookie = cookies.serialize("token", text, {
        maxAge: Number.MAX_SAFE_INTEGER,
        path: "/",
        httpOnly: true
      })
      res.setHeader("Set-Cookie", cookie)

    }
    catch(err:any){
      console.error("Fetch Error", err);
      
    }
    
  }
  
  return {}
  
}
export default MyApp
