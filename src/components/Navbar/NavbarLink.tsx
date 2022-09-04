import Link from "next/link";
import {  Children, Component } from "../../../../src/components/types"
interface Props{
  href: string;
  children:Children
}

const NavbarLink: Component<Props> = ({className, href, children}) => {
  return (
    <Link href={href}>
      {children}
    </Link>
  )
}

export default NavbarLink