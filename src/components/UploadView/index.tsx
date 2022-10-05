import { useEffect, useState } from "react"
import s from "./styles/uploadview.module.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"

interface fileinfo {
    hash: string
    name: string
}

interface Upload {
    title: string
    type: "url" | "file",
    data: string | fileinfo
    expires: Date
    createdAt: Date
}

const UploadView = () => {

    const [uploads, setUploads] = useState<Upload[]>([]);

    async function getUploads() {
        const res = await fetch("/api/upload")
        if(!res.ok)return
        const data: any[] = await res.json()

        const uploads = data.map(d => {
            const obj: Upload = {
                title: d.title,
                type: d.type == 0 ? "file" : "url",
                expires: new Date(new Date(d.expires)),
                createdAt: new Date(d.createdAt),
                data: d.type == 0 ? {
                    name: d.data.name,
                    hash: d.data.hash
                } : d.data
            };
            return obj

        }).sort((a, b) => {
            const x = a.createdAt.getTime()
            const y = b.createdAt.getTime()
            if (x < y) {
                return -1;
              }
              if (x > y) {
                return 1;
              }
              return 0;
        }).reverse()
        setUploads([...uploads])


    }

    useEffect(() => {
        getUploads()
        const interval = setInterval(()=>{
            getUploads()
        }, 20000)
        return () => {
            clearInterval(interval)
        }
    }, [])
    
    /** DD-MM-YYYY format */
    var result = "fail"; /** placeholder variable */
    try {
        var dateobj = upload.expires
        function pad(n) {return n < 10 ? "0"+n : n;}
        var result = pad(dateobj.getDate())+"/"+pad(dateobj.getMonth()+1)+"/"+dateobj.getFullYear();
    } catch (error) {
        console.log(error.message)
    }
    
    return (
        <div className={s.container}>
            {
                uploads.map(upload => (
                    <div className={s.upload}>
                        <h3 className={s.title}>{upload.title}</h3>
                        <p className={s.type}>{upload.type}</p>
                        <p className={s.expiry}>Expires <code className={s.code}>{result}, {upload.expires.toLocaleTimeString()}</code></p>
                        {
                            upload.type == "url" ?
                                <a className={s.url} href={upload.data as string}>{upload.data as string}</a>
                                :
                                <a className={s.download} download={(upload.data as fileinfo).name} href={"/api/files/"+(upload.data as fileinfo).hash}>
                                    <FontAwesomeIcon icon={faDownload} className={s.icon}/>
                                    <p>{(upload.data as fileinfo).name}</p>
                                </a>
                        }
                    </div>
                ))
            }
        </div>
    )
}

export default UploadView
