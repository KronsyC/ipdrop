import React, { useEffect, useState } from 'react'
import { Component } from '../types'
import styles from "./styles/upload.module.scss"

interface Props {
    onComplete?: () => void
}
function _arrayBufferToBase64(buffer: ArrayBuffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
function fileAsBase64(f: any) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(f)
        reader.onload = () => res(_arrayBufferToBase64(reader.result as any));
        reader.onerror = error => rej(error);
    })
}
const UploadModal: Component<Props> = ({ className, onComplete }) => {
    const [ipaddr, setIpaddr] = useState("");
    useEffect(() => {
        fetch("/api/ip")
            .then(async (res) => {
                if (!res.ok) {
                    setIpaddr("unknown")
                }
                else {
                    const addr = await res.text()
                    setIpaddr(addr)
                }

            })
    }, [])
    const [type, setType] = useState(0);
    const [title, setTitle] = useState("");
    const [expiry, setExpiry] = useState(0);
    const [url, setUrl] = useState("");
    const [file, setFile] = useState(undefined)
    const [sticky, setSticky] = useState(false)
    function handleTypeSelect(e: any) {
        const choice = (e.target.value as string).toLowerCase()
        if (choice == "file") setType(0)
        else setType(1)

    }
    async function handleSubmit(e: any) {


        e.preventDefault();
        console.log(expiry);
        console.log(type);
        console.log(url);
        console.log("sticky?", sticky);

        let data = url;
        let fname: string;
        if (type == 0) {
            if (file.target.files.length > 1) {
                alert("You can only upload one file at a time");
                return
            }
            const f = file.target.files[0];
            console.log(f);

            data = await fileAsBase64(f) as string
            fname = f.name;

        }
        const body = JSON.stringify({
            title: title,
            expiry: expiry,
            sticky: sticky,
            type: type,
            data: data,
            filename: fname
        })

        const result = await fetch("/api/upload", {
            method: "POST",
            body: body,
            headers: {
                "content-type": "application/json"
            }
        })
        if (result.ok) {
            if (onComplete) onComplete()
        }



    }
    return (
        <div className={styles.upload + " " + className}>
            <div className={styles.inner}>
                <h1>Upload A Resource</h1>

                <form onSubmit={handleSubmit}>
                    <input type="text" name="title" id="" placeholder='Title' className={styles.title} onChange={e => setTitle(e.target.value)} />
                    <div className={styles.typeContainer}>
                        <label htmlFor="type">Type:</label>
                        <select name="" id="" defaultValue={type} onChange={handleTypeSelect} className={styles.type}>
                            <option value="file">File</option>
                            <option value="url">URL</option>
                        </select>
                    </div>


                    {
                        type == 0 ?
                            (
                                <>
                                    <input type="file" name="File" id="" onChange={f => setFile(f)} />
                                </>
                            ) : <input type="text" placeholder='URL' onChange={e => setUrl(e.target.value)} className={styles.url} />
                    }

                    <ExpiryPicker onChange={e => setExpiry(e)} />
                    <div className={styles.sticky}>
                        <label htmlFor="sticky">Sticky?</label>
                        <input type="checkbox" name="" id="" checked={sticky} onChange={e => setSticky(s => !s)} />
                    </div>

                    <input type="submit" value="Upload!" className={styles.submit} />
                </form>
                <hr />
                <p>IP Address: <code>{ipaddr}</code></p>
            </div>
        </div>
    )
}

interface ExpiryProps {
    onChange?: (offset: number) => void;
}

const ExpiryPicker: Component<ExpiryProps> = ({ className, children, onChange }) => {
    const units = {
        "D": 60 * 24,
        "H": 60,
        "M": 1,
    }
    const [renders, setRenders] = useState(1)
    function handleInitialSelect(e) {
        if (e.target.value == 60 * 24) setRenders(3)
        if (e.target.value == 60) setRenders(2)
        if (e.target.value == 1) setRenders(1)

    }
    const [minutes, setMinutes] = useState(20)
    const [hours, setHours] = useState(0)
    const [days, setDays] = useState(0)
    function Validate() {

        setMinutes(m => m > 59 ? 59 : m);
        setHours(h => h > 23 ? 23 : h);
        setDays(d => d > 6 ? 6 : d);
    }
    function handleFirst(e: any) {
        const v = parseInt(e.target.value);
        if (renders == 1) setMinutes(v)
        if (renders == 2) setHours(v)
        if (renders == 3) setDays(v)
        Validate()
    }
    function handleSecond(e: any) {
        const v = parseInt(e.target.value);
        if (renders == 2) setMinutes(v)
        if (renders == 3) setHours(v)
        Validate()
    }
    function handleThird(e: any) {
        const v = parseInt(e.target.value);
        setMinutes(v)
        Validate()
    }
    useEffect(() => {
        Validate()
    }, [renders])

    useEffect(() => {
        if (onChange) {
            onChange(hours * 60 + days * 24 * 60 + minutes)
        }
    }, [hours, minutes, days])
    return (
        <div className={styles.expiryPicker} onBlur={Validate}>
            <label>Expires: </label>
            <div className={styles.set}>
                <input type="number" name="" id="" defaultValue="20" className={styles.input} min="0"
                    onChange={handleFirst}
                    value={renders === 1 ? minutes : renders == 2 ? hours : days}
                />
                <select name="" id="" onChange={handleInitialSelect} defaultValue="1" className={styles.label}>
                    {
                        Object.keys(units).map(u => (
                            <option value={units[u]}>{u}</option>
                        ))
                    }
                </select>
            </div>

            {
                renders > 1 && (
                    <>
                        <div className={styles.set}>
                            <input type="number" id='input2' defaultValue="0" className={styles.input} min="0" onChange={handleSecond} value={renders == 2 ? minutes : hours} />
                            <label htmlFor="input2" className={styles.label}>{renders == 2 ? "M" : "H"}</label>
                        </div>

                        {renders > 2 && (

                            <div className={styles.set}>
                                <input type="number" id='input3' defaultValue="0" className={styles.input} min="0" onChange={handleThird} value={minutes} />
                                <label htmlFor="input3" className={styles.label}>M</label>
                            </div>


                        )}
                    </>

                )
            }
        </div>
    )
}
export default UploadModal