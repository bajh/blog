import React from 'react'
import { graphql, Link } from 'gatsby'

const Template = ({ data, pageContext }) => {
    const { next, prev } = pageContext

    return (
        <div>
            <h1>
                {data.markdownRemark.frontmatter.title}
            </h1>
            <div className="blogpost"
                dangerouslySetInnerHTML={{
                    __html: data.markdownRemark.html,
                }}
            />

            {prev &&
                <Link to={prev.frontmatter.path}>
                    Previous
                </Link>
            }
            {next &&
                <Link to={next.frontmatter.path}>
                    Next
                </Link>
            }

        </div>
    )
}

export const query = graphql`
    query($pathSlug: String!) {
        markdownRemark(frontmatter: { path: {eq: $pathSlug} }) {
            html
            frontmatter {
                title
            }
        }
    }
`

export default Template