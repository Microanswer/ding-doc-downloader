const httpRequest = require("./Http");
const utils = require("./util");
const {adoc2md} = require("./component/adoc2md");
const accessToken = {value: ""};
const corpId = {value: ""};

function randomStr(len, base) {
    let str = "";
    let baseLength = base.length;
    for (let i = 0; i < len; i++) {
        let index = Math.floor(Math.random() * baseLength);
        str += base[index];
    }

    return str;
}

function getBase() {
    return `${window.location.protocol}//${window.location.host}`;
}

function getAccessToken() {
    return httpRequest({
        url: `${getBase()}/portal/api/v1/token/getAccessToken`,
        method: "POST"
    }).then(response => {
        if (!response.isSuccess) {
            return Promise.reject(new Error("getAccessToken Error: " + JSON.stringify(response)));
        }
        return response;
    });
}

function getDingWebAppVersion() {

    // let docframe = document.querySelectorAll("iframe");
    //
    // if (window.WSM_config && window.WSM_config.appVersion) {
    //     return window.WSM_config.appVersion;
    // }

    return "4.78.1";

}

/**
 *
 * @returns {Promise<string>}
 */
async function getDocOpenToken(dentryKey, docKey, cropid) {

    if (!window.lwpClient) {
        throw new Error("导出pdf需要lwp通信，当前lwp通信方案不可用。");
    }

    const resp = await lwpClient.sendMsg("/r/Adaptor/DingTalkDocI/getDocOpenToken", {
        "A-DENTRY-KEY": dentryKey,
        "utm_source": "portal",
        "utm_medium": "portal_space_file_tree",
        "SOURCE_DOC_APP": "doc",
        "A-DOC-KEY": docKey,
        "mid": randomStr(25, "0192837465") + " 0"
    }, [cropid, docKey]);

    const {body, code} = resp;

    if (code !== 200) {
        throw new Error(JSON.stringify(resp));
    }

    return body;
}

/**
 *
 */
function getUserInfo() {
    return httpRequest({
        url: `${getBase()}/api/users/getUserInfo`, method: "POST"
    }).then(response => {
        if (!response.isSuccess) {
            return Promise.reject(new Error("getUserInfo Error: " + JSON.stringify(response)));
        }
        return response;
    })
}

/**
 *
 * @returns {Promise<string>}
 */
async function getCorpId() {
    if (corpId.value) {
        return corpId.value;
    }

    let line = document.cookie.split(";").find(line => line.includes("portal_corp_id"));
    if (line) {
        return Promise.resolve(line.split("=").pop().trim());
    }

    return getUserInfo().then(({data}) => {
        return data.orgs.find(org => org.isMainOrg).corpId;
    });
}


/**
 *
 * @param config {{
 *     url: string,
 *     method?: "get"|"post",
 *     data?: any,
 *     headers?: object
 * }}
 */
async function doRequest(config) {
    config.url = `${getBase()}${config.url}`;
    config.headers = config.headers || {};

    if (!accessToken.value) {
        const {data} = await getAccessToken();
        accessToken.value = data.accessToken;
    }
    config.headers["A-Token"] = accessToken.value;

    if (!config.nocorpid) {
        if (!corpId.value) {
            const cid = await getCorpId();
            corpId.value = cid;
        }
        config.headers["corp-id"] = corpId.value;
    }
    return httpRequest(config).then(resp => {
        if (!resp.isSuccess) {
            return Promise.reject(new Error(JSON.stringify(resp)));
        }
        return resp;
    });
}

let content =
    {
        "version": 1,
        "type": "application/x-alidocs-package",
        "main": "00000000-0000-0000-0000-000000000001",
        "plugins": "00000000-0000-0000-0000-000000000002",
        "parts": {
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "type": "application/x-alidocs-word",
                "version": 1,
                "data": {
                    "style": {
                        "docDefaults": {
                            "type": "paragraph",
                            "default": 1,
                            "name": "dingdocnormal",
                            "data": {"rPr": {}, "pPr": {"spacing": {"before": 8, "after": 8}}}
                        }
                    },
                    "theme": [],
                    "settings": {"titleCover": {"isHide": true}},
                    "app": {},
                    "numberings": {},
                    "headers": {},
                    "body": ["root", {
                        "sectPr": {
                            "pgSz": {"w": 892, "h": 1127},
                            "pgMar": {
                                "top": 96,
                                "bottom": 96,
                                "left": 72,
                                "right": 72,
                                "header": 56.73,
                                "footer": 66.13,
                                "gutter": 0
                            }
                        }
                    }, ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false
                        }, "ind": {"left": 0}, "uuid": "lmzzty1ef5kmlb7f8sa"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "第二版本 autor 指令编辑器完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzu6s809xg90q5so06"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "团队建设："]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzubpug9lvxscsbad"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "社区平台推动完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzujki80w1unxk6ke"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "自动化文档完成。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzv1ih46bn7axky9b"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "指纹仿真度提升，继续推进。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzxy5pswytqysadgk"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "日常指令维护。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 0,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "decimal", "text": "%1.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzvj78tph96gzrxcb"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "管理形式改变："]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzw64ykn81iyb5sh"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "建设好人才梯队。"]]], ["p", {
                        "list": {
                            "listId": "wno61ttrdi",
                            "level": 1,
                            "isOrdered": true,
                            "isTaskList": false,
                            "isChecked": false,
                            "listStyleType": "DEC_LEN_LROM_P",
                            "symbolStyle": {},
                            "listStyle": {"format": "lowerLetter", "text": "%2.", "align": "left"},
                            "hideSymbol": false,
                            "extraData": {}
                        }, "ind": {"left": 0}, "uuid": "lmzzwfmaas1wsowax1"
                    }, ["span", {"data-type": "text"}, ["span", {"data-type": "leaf"}, "根据梯队，放权给对应人员。"]]]],
                    "footers": {},
                    "version": 1
                },
                "refs": {}
            }
        }
    };

// 导出 adoc → md 直接根据文档内容代码生成md内容。

// 导出 adoc → docx 流程
// upload_info
// submitExportJob
// queryExportJobInfo

// 导出 adoc → pdf 流程：
// upload_info
// createExportJob
// queryExportStatus
//

/**
 * 将钉钉文档导出为 markdown。 经过研究半天的研究，发现钉钉文档导出为markdown的情况是直接在浏览器中进行的，直接将文档数据通过
 * JavaScript代码拼装为markdown文本。
 *
 * 一开始我希望直接使用它网页中的代码来实现，但是那么多打包后的代码阅读起来实在是脑壳痛。翻来覆去在网页代码里面艰难爬行了半天
 * 最终abandon(放弃)了，还是直接直接根据文档元数据内容实现渲染吧~~。
 *
 * adoc的元数据来自 https://alidocs.dingtalk.com/api/document/data 接口的 data.documentContent.checkpoint.content 这里面。
 * 这个字段是一个字符串，字符串内容是一个json，parse即可得到文档元数据对象。在该对象的parts[0].data.body中保存了整个文档的每个段落，
 * 每句话，每个代码块每张图片区的内容信息。
 *
 * 格式是一个数组，数组定义内容如下：
 *
 * let frame = [
 *     "", // 第一个元素标识html节点名，比如：p, h1,h2,span 这些。 不过对于文档根节点， 这个必为 root
 *     {}, // 第二个元素是该节点的配置对象，里面根据不同的元素有不同的配置内容，比如：标题、颜色、坐标、间距信息等。
 *
 *     [], // 第三个及第三个之后所有的内容，都是该节点的子内容。子内容可以是：直接一个字符串文本内容，或者又是一个这种 frame 数据格式的数组。
 *     ...,
 *     ...
 * ]
 *
 *
 * @param docKey
 * @param dentryKey
 * @param name
 * @param dentryId
 */
async function downloadDingDoc2md(docKey, dentryKey, name, dentryId) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);

    let [markdownTxt, warns] = adoc2md(docData.documentContent.checkpoint.content, `https://alidocs.dingtalk.com/i/nodes/${dentryId}`);

    markdownTxt = `# ${name}\n\n${markdownTxt}`;

    const blob = new Blob([markdownTxt], { type: "text/plain" });
    return [URL.createObjectURL(blob), warns];
}

async function downloadDingDoc2pdf(docKey,dentryKey,name) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);
    const uploadBody = JSON.stringify({
        asl: docData.documentContent.checkpoint.content,
        optionsString: JSON.stringify({
            "openToken": {
                "docOpenToken": await getDocOpenToken(dentryKey, docKey, await getCorpId()),
                "corpId": await getCorpId(),
                "docKey": docKey
            },
            "isNew": true,
            "customConfig": {
                "content": "ONLYCONTENT",
                "mode": "PORTRAIT",
                "watermark": "OPEN",
                "nick": docData.fileMetaInfo.securityPolicyControl.watermarkText.rowTwo,
                "corpName": docData.fileMetaInfo.securityPolicyControl.watermarkText.rowOne,
                "link": "",
                "enableTableAutofitWidth": true
            },
            "fileName": name,
            "showDocTitle": true,
            "ctxVersion": docData.documentContent.checkpoint.baseVersion,
            "printStyle": {"backgroundColor": "var(--we_bg_default_color, rgba(255, 255, 255, 1))"},
            "version": 1,
            "appVersion": getDingWebAppVersion(),
            "exportType": "pdf",
            "corpId": await getCorpId(),
            "lang": "zh-CN"
        })
    });
    let {data: updata} = await doRequest({
        url: "/core/api/resources/9/upload_info",
        method: "POST",
        headers: {
            "a-doc-key": docKey,
            "a-host-doc-key": ""
        },
        data: {
            contentType: "",
            resourceName: docKey,
            size: uploadBody.length
        },
        nocorpid: true
    });


    // 将数据上传到oss
    await httpRequest({
        url: updata.uploadUrl,
        method: "put",
        headers: {
            "Content-Type": ""
        },
        data: uploadBody
    });

    // 创建导出任务
    let {data: jobData} = await doRequest({
        url: "/api/v2/files/createExportJob",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey,
        },
        data: {
            scene: "normal",
            storagePath: updata.storagePath
        },
        nocorpid: true
    });

    // 检查任务状态
    let done = false;
    let ossUrl = jobData.url;
    while (!done) {
        await utils.sleep(1000);
        let {data: exportData} = await doRequest({
            url: "/api/v2/files/queryExportStatus?jobId=" + jobData.jobId,
            method: "GET",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey,
            },
            nocorpid: true
        });
        done = exportData.done;
        if (done) {
            break;
        }
    }

    return ossUrl;
}


/**
 * 下载钉钉文件，包括：钉文档、钉表格；如果是钉文档那么下载为docx格式，如果是表格，那么下载为 .xlsx 格式
 */
async function downloadDingDoc(dentryUuid, docKey,dentryKey,contentType, name, size, exportType) {
    if (name.includes(".")) {
        let ns = name.split(".");
        ns.pop();
        name = ns.join(".").trim();
    }

    const {data: docData} = await getDocumentData(dentryKey, docKey);

    let uploadBody;
    if (exportType === "dingTalkdocTodocx") {
        uploadBody = JSON.stringify(Object.values(JSON.parse(docData.documentContent.checkpoint.content).parts).find(p => p.type === "application/x-alidocs-word").data);
    } else {
        let contentdata = JSON.parse(docData.documentContent.checkpoint.content);
        contentdata.setting.calc = {enableFormulaStatus: true};
        uploadBody = JSON.stringify({
            content: contentdata.content,
            customTabsMeta: contentdata.customTabsMeta,
            modules: {
                "asyncFunctionCache": [],
                "form": {},
                "dimensionMeta": {},
                "protectionRange": {},
                "follow": {},
                "tag": {},
                "dingtalkTask": [],
                "merge": {},
                "mention": {},
                "appLock": {},
                "lock": {},
                "float": {},
                "filter": {},
                "dataValidation": {},
                "reaction": {},
                "reminder": {},
                "comment": {},
                "filterView": {},
                "pivotTable": {},
                "conditionalFormatting": {},
                "calc": {"shared": {"exprs": []}},
                "externalLink": [],
                "table": {},
                "definedName": []
            },
            setting: contentdata.setting,
            sheetsMeta: contentdata.sheetsMeta,
            style: contentdata.style,
            tabs: contentdata.tabs,
            version: contentdata.version
        });
    }

    let {data: updata} = await doRequest({
        url: "/core/api/resources/9/upload_info",
        method: "POST",
        headers: {
            "a-doc-key": docKey,
            "a-host-doc-key": ""
        },
        data: {
            contentType: "",
            resourceName: name,
            size: uploadBody.length
        },
        nocorpid: true
    });

    await httpRequest({
        url: updata.uploadUrl,
        method: "put",
        headers: {
            "Content-Type": ""
        },
        data: uploadBody
    })

    let {data: jobData} = await doRequest({
        url: "/core/api/document/submitExportJob",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey,
        },
        data: {
            exportType: exportType,
            storagePath: updata.storagePath
        },
        nocorpid: true
    });

    let exportStatus = "";
    let ossUrl = "";
    while (exportStatus !== "success") {
        await utils.sleep(1000);
        let {data: exportData} = await doRequest({
            url: "/core/api/document/queryExportJobInfo?jobId=" + jobData.jobId,
            method: "GET",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey,
            },
            nocorpid: true
        });
        exportStatus = exportData.status;
        if (exportStatus === "success") {
            ossUrl = exportData.ossUrl;
        } else if (exportStatus === "failed") {
            throw new Error("导出失败");
        }
    }

    return ossUrl;
}

/**
 * 获取文档内容
 */
function getDocumentData(dentryKey, docKey = "", source = "") {
    let data = {dentryKey, pageMode: 2, fetchBody: true};
    if (source) {
        data["source"] = source;
    }
    return doRequest({
        url: "/api/document/data",
        method: "POST",
        headers: {
            "a-dentry-key": dentryKey,
            "a-doc-key": docKey || ""
        },
        data: data
    });
}

/**
 * 专用下载 amind 和 adraw
 * @param asl
 * @param optionsString
 * @return {Promise<*>}
 */
async function exportAsImg(asl, optionsString, scene = "", dentryKey, docKey) {
    let data = {
        asl: JSON.stringify(asl),
        optionsString: JSON.stringify(optionsString)
    };
    if (scene) {
        data['scene'] = scene;
    }

    let hd = {
        "a-dentry-key": dentryKey || "",
    };
    if (docKey) {
        hd["a-doc-key"] = docKey;
    }

    let {data: jobData} = await doRequest({
        url: "/api/v2/files/createExportJob",
        headers: hd,
        method: "post",
        data: data
    });

    let {jobId, done, url} = jobData;

    while (!done) {
        await utils.sleep(1000);
        let {data: jobStatus} = await doRequest({
            url: `/api/v2/files/queryExportStatus?jobId=${encodeURIComponent(jobId)}`,
            method: "get",
            headers: {
                "a-dentry-key": dentryKey,
                "a-doc-key": docKey
            },
        });
        done = jobStatus.done;
    }

    return url;
}

module.exports = {
    /**
     * 获取文档信息
     *
     */
    getDocInfo(dentryUuid) {
        return doRequest({
            url: "/box/api/v2/dentry/info?dentryUuid=" + encodeURIComponent(dentryUuid),
            method: "GET",
        });
    },

    // 列出文档子级内容
    getDocList(dentryUuid, loadMoreId = "") {
        // loadMoreId
        let query = "pageSize=100&dentryUuid=" + encodeURIComponent(dentryUuid);
        if (loadMoreId) {
            query += `&loadMoreId=${encodeURIComponent(loadMoreId)}`;
        }
        return doRequest({
            url: "/box/api/v2/dentry/list?" + query,
            method: "GET"
        }).then(response => {
            // if (response.data.children && response.data.children.length > 0) {

            //     // 将文件夹放在前面，文件放在后面。
            //     let dirs = [];
            //     let files = [];
            //     for (let i = 0; i < response.data.children.length; i++) {
            //         if (response.data.children[i].dentryType === "folder") {
            //             dirs.push(response.data.children[i]);
            //         } else {
            //             files.push(response.data.children[i]);
            //         }
            //     }
            //     response.data.children = dirs.concat(files);
            // }

            return response;
        })
    },

    /**
     *  获取空间的 dentry 信息。如果传了空间id，那么获取指定空间id的信息。如果没传，那么获取自己的空间的信息。
     *
     * @param spaceId {string?}
     */
    getSpaceInfo(spaceId) {
        if (spaceId) {
            return doRequest({
                url: "/box/api/v1/space/info?id=" + encodeURIComponent(spaceId), method: "GET"
            })
        } else {
            return doRequest({
                url: "/box/api/v1/mine/space/info", method: "GET"
            });
        }
    },


    /**
     * 下载 用户自己上传的原始文件 文件，文件contentType类型不是 alidoc 的可以使用此方法。
     * @param dentryUuid
     * @return {Promise<string>} 返回文件下载链接
     */
    downloadDocument(dentryUuid) {
        return doRequest({
            url: "/box/api/v2/file/download?dentryUuid=" + encodeURIComponent(dentryUuid) + "&supportDownloadTypes=URL_PRE_SIGNATURE,HTTP_TO_CENTER&downloadType=URL_PRE_SIGNATURE",
            method: "GET"
        }).then(response => {
            return response.data.ossUrlPreSignatureInfo.preSignUrls[0];
        });
    },

    /**
     * 下载 axls 文件
     * @param dentryUuid
     * @return {Promise<string>} 返回文件下载链接
     */
    async downloadAxls(dentryUuid, docKey,dentryKey,contentType, name, size) {
        return downloadDingDoc(dentryUuid, docKey, dentryKey, contentType, name, size , "dingTalksheetToxlsx");
    },


    /**
     * 下载 adoc 文件
     * @param dentryUuid
     * @param docKey
     * @param dentryKey
     * @param contentType
     * @param name
     * @param size
     * @param downloadFileType {".md"|".pdf"|".docx"} 下载后缀，adoc 类型的文件，支持下载为：.md, .pdf 和 .docx
     * @return {Promise<string>}
     */
    async downloadAdoc(dentryUuid, docKey,dentryKey,contentType, name, size, downloadFileType) {
        if (downloadFileType === ".docx") {
            return downloadDingDoc(dentryUuid, docKey, dentryKey, contentType, name, size, "dingTalkdocTodocx");
        } else if (downloadFileType === ".pdf") {
            return downloadDingDoc2pdf(docKey, dentryKey, name);
        } else if (downloadFileType === ".md") {
            return downloadDingDoc2md(docKey, dentryKey, name, dentryUuid);
        } else {
            throw new Error(`不支持导出为${downloadFileType}格式`);
        }
    },

    /**
     * 下载 amind 钉钉脑图文件。
     * @param dentryKey
     * @return {Promise<void>}
     */
    async downloadAmind(dentryKey, docKey) {

        let {data: docData} = await getDocumentData(dentryKey);
        let docContent = JSON.parse(docData.documentContent.checkpoint.content);
        let part = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-mind");
        let asl = part.data;

        return exportAsImg(asl, {
            "exportType": "snapshot",
            "appVersion": "1.28.0",
            "bizConfig": {
                "mode": 2,
                "collapseNodes": [],
                "padding": 50,
                "sheetId": "sheet1",
                "signConfig": {"weMind": "钉钉脑图"},
                "placeholder": "请输入文字",
                "scale": 2
            }
        }, "", dentryKey, docKey);
    },

    /**
     * 下载 adraw 钉钉白板文件
     * @return {Promise<void>}
     */
    async downloadBoard(dentryKey, docKey) {
        let {data: adrawData} = await getDocumentData(dentryKey, docKey, "adraw");
        let docContent = JSON.parse(adrawData.documentContent.checkpoint.content);
        let stage = Object.values(docContent.parts).find(p => p.type === "application/x-alidocs-draw");
        let stagedata = stage.data;

        // 计算画布大小
        let page = stagedata.pages[0];
        let minX=0,maxX=0,minY=0,maxY=0;
        for (let i = 0; i < page.shapes.length; i++) {
            let shap = page.shapes[i];
            if (shap.x < minX) {minX = shap.x;}
            if ((shap.x + shap.width) > maxX) {maxX = shap.x + shap.width}
            if (shap.y < minY) {minY = shap.y;}
            if ((shap.y + shap.height) > maxY) {maxY = shap.y + shap.height}
        }

        let width = Math.round(utils.numberRound(maxX - minX)) + 10;
        let height = Math.round(utils.numberRound(maxY - minY)) + 10;

        return exportAsImg(docContent, {
            "exportType": "snapshot",
            "bizConfig": {},
            "appVersion": "0.21.2",
            "width": width,
            "height": height
        }, "userExport", dentryKey, docKey);
    },

    /**
     *
     * @param url
     * @param fileHandler {FileSystemFileHandle}
     * @param cb
     * @return {Promise<void>}
     */
    async httpDownload(url, fileHandler, cb) {
        return new Promise((resolve, reject) => {

            async function save2File(response) {
                // console.log("开始写入文件", typeof response);
                const writer = await fileHandler.createWritable();
                await writer.write(new Blob([response]));
                await writer.close();
                // console.log("写入文件完成")
            }

            httpRequest({
                url: url,
                method: "get",
                originResponse: true,
                onBegin(loaded, total) {
                    cb({type: "begin", percent: utils.numberRound((loaded / total) * 100)})
                },
                onProgress(loaded, total) {
                    cb({type: "pending", percent: utils.numberRound((loaded / total) * 100)})
                },
                onEnd(error, response) {
                    if (error) {
                        cb({type: "error", error: error});
                        reject(new Error(error));
                    } else {
                        save2File(response).then(() => {
                            cb({type: "success"});
                            resolve();
                        }).catch(reject);
                    }
                }
            }).catch(reject);
        });
    }
}

