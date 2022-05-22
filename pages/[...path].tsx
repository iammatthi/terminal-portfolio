import { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import { GetStaticProps, GetStaticPaths } from 'next'
import { getFileContents } from '../lib/files'
import { ParsedUrlQuery } from 'querystring'
import md from 'markdown-it'
import matter from 'gray-matter'
import { FileExtension } from '../types/file'
import { getAllPaths } from '../lib/paths'

interface Props {
  path: string[]
}

interface Params extends ParsedUrlQuery {
  path: string[]
}

const Page: NextPage<Props> = ({ path }) => {
  const [data, setData] = useState<{ [key: string]: any }>()

  useEffect(() => {
    getFileContents(path).then((rawContent) => {
      const { data: frontmatter, content } = matter(rawContent.data)
      setData({
        frontmatter,
        content: content,
      })
    })
  }, [path])

  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-full w-full justify-center overflow-auto bg-white px-1 py-2 align-middle">
      <div className="prose">
        <h1>{data.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: md().render(data.content) }} />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps<Props, Params> = async (
  context
) => {
  const { path } = context.params!
  path[path.length - 1] = path[path.length - 1] + '.' + FileExtension.Markdown

  return {
    props: {
      path: path,
    },
  }
}

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  const paths = getAllPaths()

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
