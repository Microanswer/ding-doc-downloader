
// 获取各个语言的单行注释语法前缀。
function getCommentMark(lang) {
    switch (lang) {
        case "c":
        case "c++":
        case "cpp":
        case "javascript":
        case "java":
        case "js":
        case "ts":
        case "typescript":
        case "csharp":
        case "c#":
        case "swift":
        case "go":
        case "golang":
        case "rust":
        case "dart":
        case "kotlin":
        case "delphi":
        case "groovy":
        case "php":
        case "scala": return "// ";
        case "python":
        case "ruby":
        case "perl":
        case "bash":
        case "shell":
        case "powershell":
        case "r":
        case "elixir":
        case "coffeescript":
        case "toml":
        case "yaml":return "# ";
        case "lua":
        case "haskell":
        case "sql": return "-- ";
        case "ini": return "; ";
        case "html":
        case "xml": return "<!-- ";
        case "css": return "/* ";
        case "vb": return "' ";
        case "abap": return "\" ";
        case "stata": return "* ";
        case "erlang":
        case "matlab": return "% ";
        case "ocaml": return "(* ";
    }

    return "// ";
}


/**
 *
 * @param doc {(string) | ([string, object, ...string|[]][])}
 */
function adoc2md(doc) {
    let str = "";

    let tagName = doc[0];
    let tagOption = doc[1];
    let content = [];
    for (let i = 2; i < doc.length; i++) {
        content.push(doc[i]);
    }

    switch (tagName) {
        case "h1":str+="# ";break;
        case "h2":str+="## ";break;
        case "h3":str+="### ";break;
        case "h4":str+="#### ";break;
        case "h5":str+="##### ";break;
        case "a":;break;
        case "p":;break;
        case "span":;break;
        case "inlineCode": str += "`";break;
        case "code":
            str += "```" + (tagOption?.syntax || "") + "\n";
            if (tagOption?.title) {
                let cmt = getCommentMark(tagOption.syntax)
                str += cmt + tagOption.title;
                if (cmt.startsWith("<!--")) {
                    str += ` -->`;
                } else if (cmt.startsWith("/*")) {
                    str += ` */`;
                }

                str += "\n\n";
            }
        break;
    }

    if (tagOption?.list) {
        str += "* ";
    }

    if (content.length === 1 && typeof content[0] === "string") {
        str += content[0];
    } else {
        for (let i = 0; i < content.length; i++) {
            str += adoc2md(content[i]);
        }
    }

    if (tagName === "inlineCode") {
        str += "`";
    } else if (tagName === "code") {
        str += "\n```\n\n";
    } else if(["h1","h2","h3","h4","h5","p","code"].includes(tagName)) {
        str += "\n\n";
    }

    return str;
}
module.exports = {
    adoc2md,
}