import React from "react"
import Header from '../components/Header'
import { StaticQuery, Link } from 'gatsby'

const Posts = ({ allMarkdownRemark }) => (
  <div>
    {allMarkdownRemark.edges.map( edge =>
      (
        <div key={edge.node.frontmatter.path}>
          <Link to={edge.node.frontmatter.path}>
            {edge.node.frontmatter.title}
          </Link>
        </div>
      )
    )}
  </div>
)

const Layout = ({ data }) => (
  <div>
    <Header />
    <StaticQuery
      query={postsQuery}
      render={Posts}
    />
  </div>
)

export const postsQuery = graphql`
  query HomepageQuery {
    allMarkdownRemark(
      sort: {order: DESC, fields: [frontmatter___date]}
    ) {
      edges {
        node {
          frontmatter {
            title
            path
            date
          }
        }
      }
    }
  }
`

export default Layout
