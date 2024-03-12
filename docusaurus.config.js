// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  // Usually your repo name.
  deploymentBranch: 'deploy',
  favicon: 'img/favicon.ico',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  organizationName: 'anonklub',
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/anonklub/docs/edit/main/docs',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  projectName: 'anonklub.github.io',
  tagline: 'Anonymous Proof of Ethereum Address Ownership',

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      footer: {
        links: [
          {
            items: [
              {
                href: 'https://discord.gg/VVudpjfxCWt',
                label: 'Discord',
              },
              {
                href: 'https://twitter.com/PrivacyScaling',
                label: 'Twitter',
              },
            ],
            title: 'Community',
          },
          {
            items: [
              {
                href: 'https://github.com/anonklub',
                label: 'GitHub',
              },
            ],
            title: 'More',
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ethereum Foundation.`,
      },
      // Replace with your project's social card
      image: 'img/anonklub.jpg',
      navbar: {
        items: [
          {
            docId: 'intro',
            label: 'Introduction',
            position: 'left',
            type: 'doc',
          },
          {
            docId: 'example',
            label: 'Example',
            position: 'left',
            type: 'doc',
          },
          {
            to: '/docs/category/tutorial',
            label: 'Tutorial',
            position: 'left',
          },
          {
            to: '/docs/cli-demo',
            label: 'CLI Demo',
            position: 'left',
          },
          {
            to: '/docs/apis',
            label: 'APIs',
            position: 'left',
          },
          {
            to: '/docs/circuit-design',
            label: 'Circuit Design',
            position: 'left',
          },
          {
            href: 'https://github.com/anonklub',
            label: 'GitHub',
            position: 'right',
          },
        ],
        logo: {
          alt: 'Anonklub Logo',
          src: 'img/anonklub.svg',
        },
        title: 'Anonklub',
      },
      prism: {
        darkTheme: darkCodeTheme,
        theme: lightCodeTheme,
      },
    },

  title: 'Anonklub',
  // Set the production url of your site here
  url: 'https://docs.anonklub.xyz',
}

module.exports = config
