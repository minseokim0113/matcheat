"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/recommendations/route";
exports.ids = ["app/api/recommendations/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Frecommendations%2Froute&page=%2Fapi%2Frecommendations%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Frecommendations%2Froute.ts&appDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Frecommendations%2Froute&page=%2Fapi%2Frecommendations%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Frecommendations%2Froute.ts&appDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_stars_Downloads_match_eats_web_starter_match_eats_web_app_api_recommendations_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/recommendations/route.ts */ \"(rsc)/./app/api/recommendations/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/recommendations/route\",\n        pathname: \"/api/recommendations\",\n        filename: \"route\",\n        bundlePath: \"app/api/recommendations/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\stars\\\\Downloads\\\\match-eats-web-starter\\\\match-eats-web\\\\app\\\\api\\\\recommendations\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_stars_Downloads_match_eats_web_starter_match_eats_web_app_api_recommendations_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/recommendations/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZyZWNvbW1lbmRhdGlvbnMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnJlY29tbWVuZGF0aW9ucyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnJlY29tbWVuZGF0aW9ucyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNzdGFycyU1Q0Rvd25sb2FkcyU1Q21hdGNoLWVhdHMtd2ViLXN0YXJ0ZXIlNUNtYXRjaC1lYXRzLXdlYiU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDc3RhcnMlNUNEb3dubG9hZHMlNUNtYXRjaC1lYXRzLXdlYi1zdGFydGVyJTVDbWF0Y2gtZWF0cy13ZWImaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ3dEO0FBQ3JJO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWF0Y2gtZWF0cy13ZWIvP2YzMjMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcc3RhcnNcXFxcRG93bmxvYWRzXFxcXG1hdGNoLWVhdHMtd2ViLXN0YXJ0ZXJcXFxcbWF0Y2gtZWF0cy13ZWJcXFxcYXBwXFxcXGFwaVxcXFxyZWNvbW1lbmRhdGlvbnNcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3JlY29tbWVuZGF0aW9ucy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3JlY29tbWVuZGF0aW9uc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvcmVjb21tZW5kYXRpb25zL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxcc3RhcnNcXFxcRG93bmxvYWRzXFxcXG1hdGNoLWVhdHMtd2ViLXN0YXJ0ZXJcXFxcbWF0Y2gtZWF0cy13ZWJcXFxcYXBwXFxcXGFwaVxcXFxyZWNvbW1lbmRhdGlvbnNcXFxccm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL3JlY29tbWVuZGF0aW9ucy9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Frecommendations%2Froute&page=%2Fapi%2Frecommendations%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Frecommendations%2Froute.ts&appDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/recommendations/route.ts":
/*!******************************************!*\
  !*** ./app/api/recommendations/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./lib/prisma.ts\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n\n\n\nfunction overlapBudget(aMin, aMax, bMin, bMax) {\n    if (aMin === null || aMax === null || bMin === null || bMax === null) return 0;\n    const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);\n    return overlap >= 0 ? 1 : 0;\n}\nfunction score(me, other) {\n    let s = 0;\n    if (me.region && other.region) {\n        s += me.region === other.region ? 2 : 0;\n    }\n    s += overlapBudget(me.budgetMin, me.budgetMax, other.budgetMin, other.budgetMax) ? 2 : 0;\n    const tagIntersect = me.foodTags.filter((t)=>other.foodTags.includes(t)).length;\n    s += tagIntersect;\n    const timeIntersect = me.timeWindows.some((t)=>other.timeWindows.includes(t));\n    s += timeIntersect ? 1 : 0;\n    return s;\n}\nasync function GET() {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)();\n    if (!session?.user?.email) return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n        error: \"unauthorized\"\n    }, {\n        status: 401\n    });\n    const me = await _lib_prisma__WEBPACK_IMPORTED_MODULE_0__.prisma.user.findUnique({\n        where: {\n            email: session.user.email\n        },\n        include: {\n            profile: true\n        }\n    });\n    if (!me || !me.profile) return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n        list: []\n    });\n    const candidates = await _lib_prisma__WEBPACK_IMPORTED_MODULE_0__.prisma.user.findMany({\n        where: {\n            id: {\n                not: me.id\n            }\n        },\n        include: {\n            profile: true\n        }\n    });\n    const scored = candidates.filter((c)=>c.profile).map((c)=>({\n            id: c.id,\n            name: c.name,\n            email: c.email,\n            profile: c.profile,\n            score: score(me.profile, c.profile)\n        })).sort((a, b)=>b.score - a.score).slice(0, 10);\n    return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n        list: scored\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3JlY29tbWVuZGF0aW9ucy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFzQztBQUNPO0FBQ0Y7QUFVM0MsU0FBU0csY0FBY0MsSUFBaUIsRUFBRUMsSUFBaUIsRUFBRUMsSUFBaUIsRUFBRUMsSUFBaUI7SUFDL0YsSUFBSUgsU0FBUyxRQUFRQyxTQUFTLFFBQVFDLFNBQVMsUUFBUUMsU0FBUyxNQUFNLE9BQU87SUFDN0UsTUFBTUMsVUFBVUMsS0FBS0MsR0FBRyxDQUFDTCxNQUFNRSxRQUFRRSxLQUFLRSxHQUFHLENBQUNQLE1BQU1FO0lBQ3RELE9BQU9FLFdBQVcsSUFBSSxJQUFJO0FBQzVCO0FBRUEsU0FBU0ksTUFBTUMsRUFBVyxFQUFFQyxLQUFjO0lBQ3hDLElBQUlDLElBQUk7SUFDUixJQUFJRixHQUFHRyxNQUFNLElBQUlGLE1BQU1FLE1BQU0sRUFBRTtRQUM3QkQsS0FBS0YsR0FBR0csTUFBTSxLQUFLRixNQUFNRSxNQUFNLEdBQUcsSUFBSTtJQUN4QztJQUNBRCxLQUFLWixjQUFjVSxHQUFHSSxTQUFTLEVBQUVKLEdBQUdLLFNBQVMsRUFBRUosTUFBTUcsU0FBUyxFQUFFSCxNQUFNSSxTQUFTLElBQUksSUFBSTtJQUN2RixNQUFNQyxlQUFlTixHQUFHTyxRQUFRLENBQUNDLE1BQU0sQ0FBQ0MsQ0FBQUEsSUFBS1IsTUFBTU0sUUFBUSxDQUFDRyxRQUFRLENBQUNELElBQUlFLE1BQU07SUFDL0VULEtBQUtJO0lBQ0wsTUFBTU0sZ0JBQWdCWixHQUFHYSxXQUFXLENBQUNDLElBQUksQ0FBQ0wsQ0FBQUEsSUFBS1IsTUFBTVksV0FBVyxDQUFDSCxRQUFRLENBQUNEO0lBQzFFUCxLQUFLVSxnQkFBZ0IsSUFBSTtJQUN6QixPQUFPVjtBQUNUO0FBRU8sZUFBZWE7SUFDcEIsTUFBTUMsVUFBVSxNQUFNNUIsMkRBQWdCQTtJQUN0QyxJQUFJLENBQUM0QixTQUFTQyxNQUFNQyxPQUFPLE9BQU83QixxREFBWUEsQ0FBQzhCLElBQUksQ0FBQztRQUFFQyxPQUFPO0lBQWUsR0FBRztRQUFFQyxRQUFRO0lBQUk7SUFFN0YsTUFBTXJCLEtBQUssTUFBTWIsK0NBQU1BLENBQUM4QixJQUFJLENBQUNLLFVBQVUsQ0FBQztRQUFFQyxPQUFPO1lBQUVMLE9BQU9GLFFBQVFDLElBQUksQ0FBQ0MsS0FBSztRQUFDO1FBQUdNLFNBQVM7WUFBRUMsU0FBUztRQUFLO0lBQUU7SUFDM0csSUFBSSxDQUFDekIsTUFBTSxDQUFDQSxHQUFHeUIsT0FBTyxFQUFFLE9BQU9wQyxxREFBWUEsQ0FBQzhCLElBQUksQ0FBQztRQUFFTyxNQUFNLEVBQUU7SUFBQztJQUU1RCxNQUFNQyxhQUFhLE1BQU14QywrQ0FBTUEsQ0FBQzhCLElBQUksQ0FBQ1csUUFBUSxDQUFDO1FBQzVDTCxPQUFPO1lBQUVNLElBQUk7Z0JBQUVDLEtBQUs5QixHQUFHNkIsRUFBRTtZQUFDO1FBQUU7UUFDNUJMLFNBQVM7WUFBRUMsU0FBUztRQUFLO0lBQzNCO0lBRUEsTUFBTU0sU0FBU0osV0FDWm5CLE1BQU0sQ0FBQ3dCLENBQUFBLElBQUtBLEVBQUVQLE9BQU8sRUFDckJRLEdBQUcsQ0FBQ0QsQ0FBQUEsSUFBTTtZQUNUSCxJQUFJRyxFQUFFSCxFQUFFO1lBQ1JLLE1BQU1GLEVBQUVFLElBQUk7WUFDWmhCLE9BQU9jLEVBQUVkLEtBQUs7WUFDZE8sU0FBU08sRUFBRVAsT0FBTztZQUNsQjFCLE9BQU9BLE1BQU1DLEdBQUd5QixPQUFPLEVBQUdPLEVBQUVQLE9BQU87UUFDckMsSUFDQ1UsSUFBSSxDQUFDLENBQUNDLEdBQUVDLElBQU1BLEVBQUV0QyxLQUFLLEdBQUdxQyxFQUFFckMsS0FBSyxFQUMvQnVDLEtBQUssQ0FBQyxHQUFHO0lBRVosT0FBT2pELHFEQUFZQSxDQUFDOEIsSUFBSSxDQUFDO1FBQUVPLE1BQU1LO0lBQU87QUFDMUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tYXRjaC1lYXRzLXdlYi8uL2FwcC9hcGkvcmVjb21tZW5kYXRpb25zL3JvdXRlLnRzPzQ0YWMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcHJpc21hIH0gZnJvbSBcIkAvbGliL3ByaXNtYVwiO1xuaW1wb3J0IHsgZ2V0U2VydmVyU2Vzc2lvbiB9IGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuXG50eXBlIFByb2ZpbGUgPSB7XG4gIHJlZ2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgYnVkZ2V0TWluOiBudW1iZXIgfCBudWxsO1xuICBidWRnZXRNYXg6IG51bWJlciB8IG51bGw7XG4gIGZvb2RUYWdzOiBzdHJpbmdbXTtcbiAgdGltZVdpbmRvd3M6IHN0cmluZ1tdO1xufVxuXG5mdW5jdGlvbiBvdmVybGFwQnVkZ2V0KGFNaW46IG51bWJlcnxudWxsLCBhTWF4OiBudW1iZXJ8bnVsbCwgYk1pbjogbnVtYmVyfG51bGwsIGJNYXg6IG51bWJlcnxudWxsKSB7XG4gIGlmIChhTWluID09PSBudWxsIHx8IGFNYXggPT09IG51bGwgfHwgYk1pbiA9PT0gbnVsbCB8fCBiTWF4ID09PSBudWxsKSByZXR1cm4gMDtcbiAgY29uc3Qgb3ZlcmxhcCA9IE1hdGgubWluKGFNYXgsIGJNYXgpIC0gTWF0aC5tYXgoYU1pbiwgYk1pbik7XG4gIHJldHVybiBvdmVybGFwID49IDAgPyAxIDogMDtcbn1cblxuZnVuY3Rpb24gc2NvcmUobWU6IFByb2ZpbGUsIG90aGVyOiBQcm9maWxlKSB7XG4gIGxldCBzID0gMDtcbiAgaWYgKG1lLnJlZ2lvbiAmJiBvdGhlci5yZWdpb24pIHtcbiAgICBzICs9IG1lLnJlZ2lvbiA9PT0gb3RoZXIucmVnaW9uID8gMiA6IDA7XG4gIH1cbiAgcyArPSBvdmVybGFwQnVkZ2V0KG1lLmJ1ZGdldE1pbiwgbWUuYnVkZ2V0TWF4LCBvdGhlci5idWRnZXRNaW4sIG90aGVyLmJ1ZGdldE1heCkgPyAyIDogMDtcbiAgY29uc3QgdGFnSW50ZXJzZWN0ID0gbWUuZm9vZFRhZ3MuZmlsdGVyKHQgPT4gb3RoZXIuZm9vZFRhZ3MuaW5jbHVkZXModCkpLmxlbmd0aDtcbiAgcyArPSB0YWdJbnRlcnNlY3Q7XG4gIGNvbnN0IHRpbWVJbnRlcnNlY3QgPSBtZS50aW1lV2luZG93cy5zb21lKHQgPT4gb3RoZXIudGltZVdpbmRvd3MuaW5jbHVkZXModCkpO1xuICBzICs9IHRpbWVJbnRlcnNlY3QgPyAxIDogMDtcbiAgcmV0dXJuIHM7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7XG4gIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXJ2ZXJTZXNzaW9uKCk7XG4gIGlmICghc2Vzc2lvbj8udXNlcj8uZW1haWwpIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcInVuYXV0aG9yaXplZFwiIH0sIHsgc3RhdHVzOiA0MDEgfSk7XG5cbiAgY29uc3QgbWUgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHsgd2hlcmU6IHsgZW1haWw6IHNlc3Npb24udXNlci5lbWFpbCB9LCBpbmNsdWRlOiB7IHByb2ZpbGU6IHRydWUgfSB9KTtcbiAgaWYgKCFtZSB8fCAhbWUucHJvZmlsZSkgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgbGlzdDogW10gfSk7XG5cbiAgY29uc3QgY2FuZGlkYXRlcyA9IGF3YWl0IHByaXNtYS51c2VyLmZpbmRNYW55KHtcbiAgICB3aGVyZTogeyBpZDogeyBub3Q6IG1lLmlkIH0gfSxcbiAgICBpbmNsdWRlOiB7IHByb2ZpbGU6IHRydWUgfVxuICB9KTtcblxuICBjb25zdCBzY29yZWQgPSBjYW5kaWRhdGVzXG4gICAgLmZpbHRlcihjID0+IGMucHJvZmlsZSlcbiAgICAubWFwKGMgPT4gKHtcbiAgICAgIGlkOiBjLmlkLFxuICAgICAgbmFtZTogYy5uYW1lLFxuICAgICAgZW1haWw6IGMuZW1haWwsXG4gICAgICBwcm9maWxlOiBjLnByb2ZpbGUsXG4gICAgICBzY29yZTogc2NvcmUobWUucHJvZmlsZSEsIGMucHJvZmlsZSEpXG4gICAgfSkpXG4gICAgLnNvcnQoKGEsYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpXG4gICAgLnNsaWNlKDAsIDEwKTtcblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBsaXN0OiBzY29yZWQgfSk7XG59XG4iXSwibmFtZXMiOlsicHJpc21hIiwiZ2V0U2VydmVyU2Vzc2lvbiIsIk5leHRSZXNwb25zZSIsIm92ZXJsYXBCdWRnZXQiLCJhTWluIiwiYU1heCIsImJNaW4iLCJiTWF4Iiwib3ZlcmxhcCIsIk1hdGgiLCJtaW4iLCJtYXgiLCJzY29yZSIsIm1lIiwib3RoZXIiLCJzIiwicmVnaW9uIiwiYnVkZ2V0TWluIiwiYnVkZ2V0TWF4IiwidGFnSW50ZXJzZWN0IiwiZm9vZFRhZ3MiLCJmaWx0ZXIiLCJ0IiwiaW5jbHVkZXMiLCJsZW5ndGgiLCJ0aW1lSW50ZXJzZWN0IiwidGltZVdpbmRvd3MiLCJzb21lIiwiR0VUIiwic2Vzc2lvbiIsInVzZXIiLCJlbWFpbCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImluY2x1ZGUiLCJwcm9maWxlIiwibGlzdCIsImNhbmRpZGF0ZXMiLCJmaW5kTWFueSIsImlkIiwibm90Iiwic2NvcmVkIiwiYyIsIm1hcCIsIm5hbWUiLCJzb3J0IiwiYSIsImIiLCJzbGljZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/recommendations/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\n// Prevent hot-reload multiple instances in dev\nconst globalForPrisma = global;\nconst prisma = globalForPrisma.prisma || new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvcHJpc21hLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUE4QztBQUU5QywrQ0FBK0M7QUFDL0MsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsR0FBRztBQUNuRSxJQUFJSSxJQUF5QixFQUFjSCxnQkFBZ0JFLE1BQU0sR0FBR0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tYXRjaC1lYXRzLXdlYi8uL2xpYi9wcmlzbWEudHM/OTgyMiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCc7XG5cbi8vIFByZXZlbnQgaG90LXJlbG9hZCBtdWx0aXBsZSBpbnN0YW5jZXMgaW4gZGV2XG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWwgYXMgdW5rbm93biBhcyB7IHByaXNtYTogUHJpc21hQ2xpZW50IH07XG5cbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hIHx8IG5ldyBQcmlzbWFDbGllbnQoKTtcbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gcHJpc21hO1xuIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsImdsb2JhbEZvclByaXNtYSIsImdsb2JhbCIsInByaXNtYSIsInByb2Nlc3MiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/jose","vendor-chunks/next-auth","vendor-chunks/openid-client","vendor-chunks/@babel","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/lru-cache","vendor-chunks/cookie","vendor-chunks/@panva","vendor-chunks/oidc-token-hash"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Frecommendations%2Froute&page=%2Fapi%2Frecommendations%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Frecommendations%2Froute.ts&appDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cstars%5CDownloads%5Cmatch-eats-web-starter%5Cmatch-eats-web&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();