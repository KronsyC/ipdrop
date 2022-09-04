import react from "react"

interface Props{
    className?: string;
    children?: any[]
}




export type Component<T={}> = react.FC<Props & T>