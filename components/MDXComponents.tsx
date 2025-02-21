import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import PCAWrapper from '@/components/circular-features-graphs/PCAWrapper'
import FinancesWrapper from './swedish-state-finances/FinancesWrapper'

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
  PCAVisualization: PCAWrapper,
  FinancesVisualization: FinancesWrapper,
}
