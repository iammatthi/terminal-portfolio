import { FileExtension } from '@customtypes/file'
import { getFileContents } from '@lib/files'
import { getAllPaths } from '@lib/paths'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import type { NextPage } from 'next'
import { GetStaticPaths, GetStaticProps } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { useEffect, useState } from 'react'

interface Props {
  path: string[]
}

interface Params extends ParsedUrlQuery {
  path: string[]
}

// Add target blank to all links
// https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md
const md = new MarkdownIt()
var defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  var aIndex = tokens[idx].attrIndex('target')
  if (aIndex < 0)
    tokens[idx].attrPush(['target', '_blank']) // add new attribute
  else tokens[idx].attrs![aIndex][1] = '_blank' // replace value of existing attr
  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self)
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
        <div dangerouslySetInnerHTML={{ __html: md.render(data.content) }} />
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
