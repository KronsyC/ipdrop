import Navbar from "../components/Navbar"

import styles from "../styles/pg/index.module.scss"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import UploadModal from "../components/UploadModal"
import { useState } from "react"
import UploadView from "../components/UploadView"
const Home = () => {
  const [modal, setModal] = useState(false);
  return (

    <main className={styles.page}>

      <Navbar className={styles.navbar} />
      <div className={styles.content}>
        {modal && 
        <UploadModal className={styles.uploadModal} onComplete={()=>setModal(m=>!m)} />
        }
        
        <div className={styles.uploads}>
          <h2>Recent Uploads</h2>
          <UploadView/>
        </div>

        {/* Upload File, Floating Btn */}
        <button className={styles.uploadBtn}  onClick={()=>setModal(m=>!m)}>
          <div className={styles.uploadCircle}>
            <FontAwesomeIcon icon={faPlus} className={styles.plus} />

          </div>
          <div className={styles.uploadBar}>
            Upload
          </div>
        </button>
      </div>



    </main>

  )
}

export default Home