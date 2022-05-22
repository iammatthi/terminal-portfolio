import type { NextPage } from 'next'
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next'
import { getAllPaths } from '../lib/path'
import { getFileContents } from '../lib/files'
import { ParsedUrlQuery } from 'querystring'
import md from 'markdown-it'
import matter from 'gray-matter'
import { FileExtension } from '../types/file'

interface Props {
  content: string
  frontmatter: { [key: string]: any }
}

interface Params extends ParsedUrlQuery {
  path: string[]
}

const Page: NextPage<Props> = ({ frontmatter, content }) => {
  return (
    <div className="flex h-full w-full justify-center overflow-auto bg-white px-1 py-2 align-middle">
      <div className="prose">
        <h1>{frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: md().render(content) }} />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props, Params> = async (
  context
) => {
  const { path } = context.params!
  path[path.length - 1] = path[path.length - 1] + '.' + FileExtension.Markdown
  const rawContent = await getFileContents(path)

  if (rawContent.error) {
    return {
      props: {
        frontmatter: {},
        content: '',
      },
    }
  }

  const { data: frontmatter, content } = matter(rawContent.data)
  return {
    props: {
      frontmatter,
      content: content,
    },
  }
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const allPaths = await getAllPaths()

  if (allPaths.error) {
    return {
      paths: [],
      fallback: false,
    }
  }

  const paths = allPaths.data as string[]

  return {
    paths: paths
      .filter((path) => path.match(new RegExp(`.${FileExtension.Markdown}$`)))
      .map((path) => ({
        params: {
          path: path
            .replace(new RegExp(`.${FileExtension.Markdown}$`), '')
            .split('/'),
        },
      })),
    fallback: false,
  }
}

export default Page
