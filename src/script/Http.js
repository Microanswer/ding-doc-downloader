function getHeaders(headers, url) {

    // let host = url.replace("https://", "").replace("http://", "").split("/")[0];

    let defaultHead = {
        'Accept': 'application/json, text/plain, */*',
       // 'Host': host
    };

    return Object.assign(defaultHead, headers || {});
}


// function fetchRequest(config) {
//     let { url, method = 'GET', data, headers } = config;
//     let dataClass = Object.prototype.toString.call(data);
//
//
//     if ("[object Object]" === dataClass) {
//         headers = headers || {};
//         headers['Content-Type'] = 'application/json;charset=UTF-8';
//     }
//
//     const options = {
//         method: method,
//         headers: getHeaders(headers, url)
//     };
//
//     if ("[object Object]" === dataClass) {
//         options.body = JSON.stringify(data);
//     } else if ("[object FormData]" === dataClass) {
//         options.body = data;
//     }
//
//     return fetch(url, options)
//         .then((response) => {
//             if (!response.ok) {
//                 throw new Error(`HTTP request failed with status ${response.status}`);
//             }
//             let contenttype = response.headers.get("content-type");
//             if (!contenttype) {
//                 return response.text();
//             }
//             if (contenttype.includes("json")) {
//                 return response.json();
//             } else {
//                 return response.text();
//             }
//         }).then(response => {
//             if (typeof response === "string" && response.indexOf("{") === 0 && response.lastIndexOf("}") === response.length - 1) {
//                 return JSON.parse(response);
//             }
//             return response;
//         })
//         .catch((error) => {
//             throw new Error(`Network error: ${error.message}`);
//         });
// }

function xhrRequest(config) {
    let { url, method = 'GET', data, headers } = config;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let dataClass = Object.prototype.toString.call(data);
        let error = undefined;

        if ("[object Object]" === dataClass || "[object String]" === dataClass) {
            headers = headers || {};
            if (!("Content-Type" in headers)) {
                headers['Content-Type'] = 'application/json;charset=UTF-8';
            }
        }

        xhr.open(method, url, true);

        let headers_ = getHeaders(headers, url);

        for (const key in headers_) {
            if (Object.hasOwnProperty.call(headers_, key)) {
                xhr.setRequestHeader(key, headers_[key]);
            }
        }

        xhr.addEventListener("loadstart", function (event){
            config.onBegin && config.onBegin(event.loaded, event.total);
        });
        xhr.addEventListener("progress", function (event){
            config.onProgress && config.onProgress(event.loaded, event.total);
        });
        xhr.addEventListener("loadend", function (event) {
            config.onEnd && config.onEnd(error, xhr.response);
        });

        if (config.originResponse) {
            xhr.responseType = "blob";
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (config.originResponse) {
                        resolve(xhr.response);
                    } else {
                        const contentType = xhr.getResponseHeader('Content-Type') || "";
                        if (contentType.includes("json")) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            resolve(xhr.responseText);
                        }
                    }
                } else {
                    error = `HTTP request failed with status ${xhr.status}`;
                    reject(new Error(error));
                }
            }
        };

        xhr.onerror = () => {
            error = `Network error`;
            reject(new Error(error));
        };


        if ("[object Object]" === dataClass) {
            xhr.send(JSON.stringify(data));
        } else if ("[object FormData]" === dataClass || "[object String]" === dataClass) {
            xhr.send(data);
        } else {
            xhr.send();
        }
    });
}

/**
 * 执行http请求。
 * @param config {{
 *     url: string,
 *     method: "get"|"post"?,
 *     data: any?,
 *     headers: object?,
 *     originResponse: boolean?,
 *     onBegin: function(number, number)?
 *     onProgress: function(number, number)?,
 *     onEnd: function(Error, any)?
 * }}
 * @returns {Promise<any>}
 */
function httpRequest(config) {
    return xhrRequest(config);
}

module.exports = httpRequest;
