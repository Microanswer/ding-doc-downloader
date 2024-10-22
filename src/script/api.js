const httpRequest = require("./Http");
const utils = require("./util");
const accessToken = {value: ""};
const corpId = {value: ""};

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

/**
 *
 * @return {Promise<{
 *    "status":200,
 *    "isSuccess":true,
 *    "data":{
 *        "accessToken":"MTg1OTE2MDc5UnbQAnGoIfrfusMyYCUMWMMrQhwDscvh",
 *        "docTypeList":[
 *            "Doc",
 *            "Draw",
 *            "Mind",
 *            "Notable",
 *            "Sheet",
 *            "Whiteboard"
 *        ],
 *        "isVisitor":false,
 *        "orgs":[
 *            {
 *                "corpId":"ding3d99cda18de6e0d035c2f4657eb6378f",
 *                "isMainOrg":true,
 *                "isPersonalOrg":false,
 *                "name":"成都直新科技有限公司",
 *                "orgId":93255011
 *            },
 *            {
 *                "corpId":"ding6cd7a975759d879ba39a90f97fcb1e09",
 *                "isMainOrg":false,
 *                "isPersonalOrg":false,
 *                "name":"成都直新科技有限公司的合作伙伴",
 *                "orgId":586250006
 *            }
 *        ],
 *        "user":{
 *            "avatarUrl":"https://static.dingtalk.com/media/lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA_540_540.png",
 *            "loginType":0,
 *            "nick":"范雪蛟",
 *            "nickPinyin":"fan^xue^jiao",
 *            "uid":185916079
 *        },
 *        "userPreferences":[
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"codeBlockTheme",
 *                "preferenceValue":"{\"syntax\":\"plaintext\",\"theme\":\"default\"}"
 *            },
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"colorPanelMode",
 *                "preferenceValue":"{\"mode\":\"art\"}"
 *            },
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"docMode",
 *                "preferenceValue":"PRO"
 *            },
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"pageMode",
 *                "preferenceValue":"normal_layout"
 *            },
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"switchOffCloseNotify",
 *                "preferenceValue":"true"
 *            },
 *            {
 *                "bizId":"doc",
 *                "preferenceKey":"userSettings",
 *                "preferenceValue":"{\"toolbarMode\":\"doubleLine\",\"contentMode\":\"paper\",\"showToc\":\"false\",\"correcting\":\"true\",\"autoSpacing\":\"true\"}"
 *            }
 *        ]
 *    }
 * }>}
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

function getCorpId() {
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


/**
 * 下载钉钉文件，包括：钉文档、钉表格
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
     * @return {{
     *    "status":200,
     *    "isSuccess":true,
     *    "data":{
     *        "ancestorList":[],
     *        "bizSceneCode":2,
     *        "corpId":"ding3d99cda18de6e0d035c2f4657eb6378f",
     *        "createdTime":1692081071000,
     *        "creator":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":0,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "dentryId":"E0Vzgx7lyAE1dXJe",
     *        "dentryKey":"pkb7BJOaWcMVNe8Q",
     *        "dentryStatistic":{
     *            "childrenCount":1
     *        },
     *        "dentryType":"folder",
     *        "dentryUuid":"mExel2BLV5y3b1Z6cxEwPopYVgk9rpMq",
     *        "depth":1,
     *        "driveDentryId":"113112754852",
     *        "driveParentDentryId":"37483966289",
     *        "driveSceneType":"orgBizMeta",
     *        "driveSpaceId":"2823535130",
     *        "finalizeInfo":{
     *            "enableFinalize":false
     *        },
     *        "hasChildren":true,
     *        "illegal":false,
     *        "isInTrash":false,
     *        "name":"课件",
     *        "orgId":"93255011",
     *        "parentDentryId":"JaYr98zn2zLxnd6W",
     *        "parentDentryUuid":"amweZ92PV6yq1naQc4LpwpNRWxEKBD6p",
     *        "positionCursor":"pos:-1376248.0",
     *        "securityInfo":{
     *            "forbiddenCopy":{
     *                "isInherit":true,
     *                "name":"forbiddenCopy",
     *                "value":false
     *            },
     *            "forbiddenSpread":{
     *                "isInherit":true,
     *                "name":"forbiddenSpread",
     *                "value":false
     *            },
     *            "watermark":{
     *                "isInherit":false,
     *                "name":"watermark",
     *                "value":false
     *            }
     *        },
     *        "shareScopeInfo":{
     *            "scope":0
     *        },
     *        "spaceId":"E0VzgyD5ylldmJep",
     *        "spaceProfile":{
     *            "createdTime":1624848955461,
     *            "description":"",
     *            "driveSpaceId":"2823535130",
     *            "icon":"",
     *            "id":"E0VzgyD5ylldmJep",
     *            "name":"mine space",
     *            "owner":{
     *                "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *                "name":"范雪蛟",
     *                "uid":"185916079"
     *            },
     *            "rootDentryUuid":"amweZ92PV6yq1naQc4LpwpNRWxEKBD6p",
     *            "type":2,
     *            "updatedTime":1717571647394
     *        },
     *        "thumbnail":"",
     *        "updatedTime":1692081071000,
     *        "updator":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":0,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "url":{
     *
     *        },
     *        "visitorRelatedInfo":{
     *            "collaboratorRoleId":"5000",
     *            "dentryActions":[
     *                "GET_DENTRY_MEMBER",
     *                "GET_DENTRY",
     *                "MANAGE_DENTRY_MEMBER",
     *                "DELETE_DENTRY",
     *                "MANAGE_SECURITY_SETTING",
     *                "UPLOAD_FOLDER",
     *                "MOVE_DENTRY",
     *                "RENAME_DENTRY",
     *                "IMPORT",
     *                "CHANGE_PERMISSION_MODE",
     *                "CREATE_CHILD",
     *                "PUBLIC_SHARE",
     *                "IMPORT_FOLDER",
     *                "LINK_SHARE",
     *                "SAVE_AS_QUICK_LINK",
     *                "UPLOAD",
     *                "LIST_CHILD",
     *                "SAVE_AS",
     *                "TEMPORARY_SHARE_NODE",
     *                "RECYCLE_DENTRY",
     *                "RECOVER_DENTRY",
     *                "PREVIEW",
     *                "DUPLICATE_FILE_TO"
     *            ],
     *            "hasForbidden":false,
     *            "roleId":"5000",
     *            "roles":[
     *                {
     *                    "code":"5000"
     *                }
     *            ]
     *        }
     *    }
     * }}
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
     * @return {Promise<{
     *    "status":200,
     *    "isSuccess":true,
     *    "data":{
     *        "alidocsQuota":48471009,
     *        "contentUpdatedTime":1717571702201,
     *        "contentUpdater":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":2,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "corpId":"ding3d99cda18de6e0d035c2f4657eb6378f",
     *        "cover":"",
     *        "createdTime":1624848955461,
     *        "creator":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":2,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "description":"",
     *        "driveDentryId":"37483966289",
     *        "driveSpaceId":"2823535130",
     *        "extraAttributeList":[],
     *        "fileQuota":14655,
     *        "icon":"",
     *        "id":"E0VzgyD5ylldmJep",
     *        "maxQuota":2147483648,
     *        "myFilesQuota":{
     *            "maxQuota":4294967296,
     *            "usedQuota":0
     *        },
     *        "name":"mine space",
     *        "orgId":"93255011",
     *        "owner":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":2,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "rootDentryUuid":"amweZ92PV6yq1naQc4LpwpNRWxEKBD6p",
     *        "securityInfo":{
     *            "forbiddenCopy":{
     *                "isInherit":false,
     *                "name":"forbiddenCopy",
     *                "value":false
     *            },
     *            "watermark":{
     *                "isInherit":false,
     *                "name":"watermark",
     *                "value":false
     *            }
     *        },
     *        "shareScopeInfo":{
     *            "scope":0
     *        },
     *        "spaceUuid":"xPar2SZbwZppdaVJ",
     *        "status":0,
     *        "subType":0,
     *        "type":2,
     *        "updatedTime":1717571647394,
     *        "updator":{
     *            "avatorMediaId":"@lQLPD2_UPzN8aGHNAhzNAhywz4BzVv2LHHgF-krn8tH5AA",
     *            "loginUserType":2,
     *            "name":"范雪蛟",
     *            "uid":"185916079"
     *        },
     *        "usedQuota":48485664,
     *        "visitorRelatedInfo":{
     *            "collaboratorRoleId":"5000",
     *            "dentryActions":[
     *                "COPY_DENTRY",
     *                "GET_DENTRY_MEMBER",
     *                "GET_DENTRY",
     *                "MANAGE_DENTRY_MEMBER",
     *                "DELETE_DENTRY",
     *                "MANAGE_SECURITY_SETTING",
     *                "UPLOAD_FOLDER",
     *                "MOVE_DENTRY",
     *                "RENAME_DENTRY",
     *                "IMPORT",
     *                "CHANGE_PERMISSION_MODE",
     *                "CREATE_CHILD",
     *                "PUBLIC_SHARE",
     *                "IMPORT_FOLDER",
     *                "LINK_SHARE",
     *                "SAVE_AS_QUICK_LINK",
     *                "UPLOAD",
     *                "LIST_CHILD",
     *                "SAVE_AS",
     *                "TEMPORARY_SHARE_NODE",
     *                "RECYCLE_DENTRY",
     *                "RECOVER_DENTRY",
     *                "PREVIEW"
     *            ],
     *            "relatedMarks":[],
     *            "roleId":"5000",
     *            "roles":[
     *                {
     *                    "code":"5000"
     *                }
     *            ],
     *            "spaceActions":[
     *                "PUBLIC_SHARE_SPACE",
     *                "MANAGE_SPACE_TEMPLATE",
     *                "GET_SPACE_TEMPLATE",
     *                "MANAGE_SPACE_PIN",
     *                "GET_SPACE_MEMBER",
     *                "DELETE_SPACE",
     *                "GET_SPACE_SECURITY",
     *                "RECYCLE_SPACE",
     *                "HANDOVER_WORKSPACE",
     *                "MANAGE_SPACE_SECURITY",
     *                "LINK_SHARE",
     *                "UPDATE_SPACE",
     *                "USE_SPACE_TEMPLATE",
     *                "GET_SPACE",
     *                "MANAGE_SPACE_MEMBER",
     *                "RENAME_SPACE",
     *                "RECOVER_SPACE"
     *            ]
     *        }
     *    }
     * }>}
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
     * @return {Promise<string>}
     */
    async downloadAdoc(dentryUuid, docKey,dentryKey,contentType, name, size) {
        return downloadDingDoc(dentryUuid, docKey, dentryKey, contentType, name, size , "dingTalkdocTodocx");
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

