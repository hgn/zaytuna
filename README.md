# Installation Info


## Prerequisites

**To Use**

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer.

**Proxy Setings**
```bash
#open the git config file
git config --global --edit
# add the following lines to the file,
# where USER_NAME and PASSWORD  are replaced by your login and password for the proxy,
# and PROXY_NAME is the name of the proxy server, e.g. something like proxy.company-network.net
[https]
    proxy = https://USER_NAME:PASSWORD@PROXY_NAME:80/
	sslVerify = false
[http]
	proxy = http://USER_NAME:PASSWORD@PROXY_NAME:80/
	sslVerify = false
	postBuffer = 524288000
```

## Installation and Start Zaytuna

From your command line:

**How to clone and execute Zaytuna**
```bash
# Clone this repository
git clone https://scm-01.rsint.net/woerle_l/zaytuna.git
# Go into the repository
cd zaytuna
# Install dependencies
npm install
# Run the app
npm start
```

**How to built an executable from the sources with electron-packager or with electron-builder**
```bash
# Once exectured (npm start) you simple call the exectron-packager:
electron-packager ./ --platform=win32 --arch=x64 --out=dist --ignore=node_modules

Note : This commande build the executable for win32-x64
You can change the values if you want to build zaytuna for other platform and achitecture
<platform> Allowed values: linux, win32, darwin, all
<arch> Allowed values: ia32, x64, all

# Build the executable with [electron-builder](https://www.npmjs.com/package/electron-builder) : it gives .exe for win32-ia32 and win32-x64 with a compressed source code
npm run pack

```

# Zaytuna

**Basic Files:**

- `index.html` - A web page to render.
- `main.js` - Starts the app and creates a browser window to render HTML.
- `package.json` - Points to the app's main file and lists its details and dependencies.




