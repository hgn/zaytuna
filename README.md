# Installation Info of Zaytuna


## Prerequisites

**To Use**

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer.

**Proxy Settings Git**
```bash
# edit the git config file  with $editor
git config --global --edit
```
And add the following lines to the git configuration.
Replace USERNAME and PASSWORD with your credentials or leave blank if no authentication is required.
PROXYNAME is obviously the name of the proxy server, e.g. something like proxy.company-network.net.

```bash
[https]
    proxy = https://USERNAME:PASSWORD@PROXYNAME:80/
    # not required for this setup, but if your gitlab instance is hosted
    # has no trusted certificates git will warm about this, disable for now
    sslVerify = false
[http]
    proxy = http://USERNAME:PASSWORD@PROXYNAME:80/
    postBuffer = 524288000
```

**Proxy Settings NPM**

If a proxy is available make sure you configure the proxy also for npm:

```bash
npm config set proxy http://USER_NAME:PASSWORD@PROXY_NAME:80
npm config set https-proxy https://USER_NAME:PASSWORD@PROXY_NAME:80
```

## Installation and Start Zaytuna

From your command line:

**How to clone and execute Zaytuna**
```bash
# Clone this repository
git clone https://github.com/hgn/zaytuna.git
# Go into the repository
cd zaytuna
# Install dependencies
npm install
# Run the app
npm start
```

**How to built an executable from the sources**


Build the executable with [electron-builder](https://www.npmjs.com/package/electron-builder) : it generates an .exe for win32-ia32 and win32-x64 with a compressed source code. For Linux an AppImage as well as an dynamically linked ELF image is generated.

```bash
npm run pack
```

# Zaytuna

**Basic Files:**

- `index.html` - A web page to render.
- `main.js` - Starts the app and creates a browser window to render HTML.
- `package.json` - Points to the app's main file and lists its details and dependencies.




