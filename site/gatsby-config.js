module.exports = {
  siteMetadata: {
    title: 'Blog',
    description: 'Blog',
  },
  plugins: [
    'gatsby-transformer-remark',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: `${__dirname}/src/pages`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'assets',
        path: `${__dirname}/static`,
        ignore: ['**/\.*'],
      },
    },
  ]
}
