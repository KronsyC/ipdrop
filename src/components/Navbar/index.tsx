import { Component } from "../types"
import style from "./styles/navbar.module.scss"
interface Props{
  children: React.ReactElement|React.ReactElement[]
}

const Navbar:Component<Props> = ({children, className}) => {
  if(!Array.isArray(children))children=[children]
  return (
    <header className={style.navbar + " " + className}>
      <div className={style["logo-container"]}>
        <h1 className={style.logo}>IPDrop</h1>
        <h3 className={style.flavortext}>Local File Sharing</h3>
      </div>
      <nav>
        <ul>
          {children.map(child => (
            child
          ))}
        </ul>
      </nav>
    </header>
    )
}

export default Navbar