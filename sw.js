/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js");

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "bundle.css",
    "revision": "80d4e02b4c08ebd286bec0fac299a7d6"
  },
  {
    "url": "bundle.js",
    "revision": "828502876f73bc476b71cf60a8d87f6d"
  },
  {
    "url": "favicon.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-128x128.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-144x144.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-152x152.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-192x192.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-384x384.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-512x512.png",
    "revision": "fa62472fa9568376080ef252485970b2"
  },
  {
    "url": "images/icons/icon-72x72.png",
    "revision": "a18c6cfaaabb3464fc4e58e44e8b9b7e"
  },
  {
    "url": "images/icons/icon-96x96.png",
    "revision": "83126cbac428573be0689c020e577337"
  },
  {
    "url": "index.html",
    "revision": "92838498c40343c8c63907215b7d036d"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
