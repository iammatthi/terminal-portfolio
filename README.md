<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">Terminal Portfolio 💻</h3>

  <p align="center">
    A portfolio website with the style of a terminal.
  </p>
</div>

![terminal-portfolio](https://user-images.githubusercontent.com/40419916/185617624-3bc79701-f130-4385-b1d2-850fbf416e28.png)

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#get-notified-when-users-request-a-new-command">Get notified when users request a new command</a></li>
      </ul>
    </li>
    <li><a href="#run-the-application">Run The Application</a></li>
    <ul>
      <li><a href="#development">Development</a></li>
    </ul>    
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

Terminal Portfolio is a portfolio website with the style of a terminal. Feel free to use it for your own portfolio.

⚠️ Mobile version is a bit buggy.

### Built With

- [Next.js](https://nextjs.org/)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple example steps.

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/iammatthi/terminal-portfolio.git
   ```
2. Move into the newly created folder
   ```sh
   cd terminal-portfolio
   ```
3. Install dependencies
   ```sh
   yarn
   ```
4. Customize configuration
   1. Create and edit `.env` file (see [`.env.example`](.env.example) for an example)
   2. Edit SEO information ([`config/seo.json`](config/seo.json))
   3. Edit favicon ([`public/favicon.ico`](public/favicon.ico))
   4. Edit files ([`public/contents`](public/contents))

### Get notified when users request a new command

1. Go to [emailjs.com](https://www.emailjs.com/)
   1. Create EmailJS account
   2. Create EmailJS service
   3. Create EmailJS template
   4. Account > API Settings > Allow EmailJS API for non-browser applications.
2. Insert EmailJS information into `.env` file

<!-- USAGE EXAMPLES -->

## Run The Application

### Development

```bash
yarn dev
```
