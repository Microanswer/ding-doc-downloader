/**
 *
 * @type {{id:string,title:string, body: {msg: string, detail: string}, githubCreated: false}[]}
 */
let errors = JSON.parse(localStorage.getItem("errors") || "[]");


function pushError(title, msg, detail) {
    let err = {
        id: Math.random().toString(36).substr(2),
        title: title,
        body: {
            msg: msg,
            detail: detail
        },
        githubCreated: false
    }
    errors.push(err);
}


function createIssue(errId) {
    let e = errors.find(v => v.id === errId);
    if (!e) return;

    window.open(`https://github.com/Microanswer/ding-doc-downloader/issues/new?title=${encodeURIComponent(e.title)}&body=${encodeURIComponent("错误信息：" + (e.body.msg||"-")) + "\n\n错误详情：" + (e.body.detail||"-")}`, "_blank");
}


function removeError(errId) {
    let index = errors.findIndex(v => v.id === errId);
    if (index > -1) errors.splice(index, 1);
}

function clearError() {
    errors = [];
    localStorage.removeItem("errors");
}