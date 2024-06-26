import { useEffect, useState } from "react"
import s from "./styles/uploadview.module.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"

interface fileinfo {
    hash: string
    name: string
}

interface Upload {
    id: number
    title: string
    type: "url" | "file"
    data: string | fileinfo
    expires: Date
    createdAt: Date
}

const UploadView = () => {

    const [uploads, setUploads] = useState<Upload[]>([]);

    async function getUploads() {
        console.log("Get uploads")
        const res = await fetch("/api/upload")
        if(!res.ok)return
        const data: any[] = await res.json()

        const uploads = data.map(d => {
            console.log("Upload", d)
            const obj: Upload = {
                id: d.id,
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
    
    return (
        <div className={s.container}>
            {
                uploads.map(upload => (
                    <div className={s.upload} key={upload.id}>
                        <h3 className={s.title}>{upload.title}</h3>
                        <p className={s.type}>{upload.type}</p>
                        <p className={s.expiry}>Expires <code className={s.code}>{upload.expires.toLocaleDateString("en-GB")}, {upload.expires.toLocaleTimeString()}</code></p>
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
