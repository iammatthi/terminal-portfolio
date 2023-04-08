import { FC } from 'react'
import { GrGithub } from 'react-icons/gr'

interface Props {}

const Footer: FC<Props> = () => {
  return (
    <footer className="absolute bottom-0 h-10 w-full">
      <div className="flex items-center justify-center">
        <a
          href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB}`}
          target="_blank"
        >
          <GrGithub size={30} color="white" />
        </a>
      </div>
    </footer>
  )
}

export default Footer
