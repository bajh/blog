import React from 'react'
import { StaticQuery } from 'gatsby'

const TitleAndDescription = ( data ) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }}>
    <h2 style={{ marginBottom: 0 }}>
      {data.site.siteMetadata.title}
    </h2>
    <p style={{
      marginTop: 0,
      opacity: 0.5,
    }}>
      {data.site.siteMetadata.description}
    </p>
  </div>
)

const Header = () => (
  <StaticQuery
    query={graphql`
      query {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `}
    render={TitleAndDescription}
  />
)

export default Header