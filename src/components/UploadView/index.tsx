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
                    <div className={s.upload}>
                        <h3 className={s.title}>{upload.title}</h3>
                        <p className={s.type}>{upload.type}</p>
                        <p className={s.expiry}>Expires <code>{upload.expires.toLocaleDateString()} {upload.expires.toLocaleTimeString()}</code></p>
                        {
                            upload.type == "url" ?
                                <a href={upload.data as string}>{upload.data as string}</a>
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