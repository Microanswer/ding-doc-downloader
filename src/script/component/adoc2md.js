class WorkSpace {
    values;
    parent;

    /**
     *
     * @param workSpace {WorkSpace?}
     */
    constructor(workSpace) {
        if (workSpace) {
            this.parent = workSpace;
        }
        this.values = {};
    }

    get(k) {
        let v = this.values[k];
        if (typeof v === "undefined" || v === null) {
            if (this.parent)
                return this.parent.get(k);
        }

        return v;
    }


    set(k, v, root = false) {
        if (root && this.parent) {
            this.parent.set(k, v, root);
            return;
        }
        this.values[k] = v;
    }
}


const Frames = new Map();

/**
 *
 * @param tagname {string}
 * @param frame {BaseFrame}
 */
function registFrame(tagname, frame) {
    Frames.set(tagname, frame);
}

function getFrame(tagname) {
    return Frames.get(tagname);
}


class BaseFrame {

    constructor() {

    }

    getBefore(tagName, tagOption,areadyMD = "", workSpace) {
        return "";
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        let tagName = frame[0];
        let tagOption = frame[1];
        let content = [];
        for (let i = 2; i < frame.length; i++) {
            content.push(frame[i]);
        }

        const before = this.getBefore(tagName, tagOption, areadyMD, workSpace);

        let ctx = "";
        if (content.length === 1 && typeof content[0] === "string") {
            ctx = content[0].replace(/\r/g, "");
        } else {

            for (let i = 0; i < content.length; i++) {
                let item = content[i];
                const fhd = getFrame(item[0]);
                if (!fhd) {
                    console.log(JSON.stringify(item, null, 2));
                    throw new Error("不支持渲染节点：" + item[0]);
                }

                ctx += fhd.getMarkdown(item, ctx, new WorkSpace(workSpace));
            }

        }

        const after = this.getAfter(tagName, tagOption, ctx, workSpace);

        // 空内容的时候，before 和 after 都忽略。
        // 如果不想忽略，可以在 workSpace 中添加 allowEmptyContent 设置为 true、
        if (ctx.trim().length === 0 && !workSpace.get("allowEmptyContent")) {
            return "";
        }

        let md = [before, ctx, after].join("");

        if (md.trim().length === 0) {
            return "";
        }

        return md;
    }


    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "";
    }
}

class RootFrame extends BaseFrame {}

class HeaderFrame extends BaseFrame {
    #hx;
    constructor(hx) {
        super();
        this.#hx = hx;
    }


    getBefore(tagName, tagOption, areadyMD, workSpace) {
        return `${this.#hx} `;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        return "\n\n";
    }
}

class InlineFrame extends BaseFrame {
    #pre;
    #after;
    constructor(pre, after) {
        super();
        this.#pre = pre;
        this.#after = after;
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {
        let be = "";



        if (tagOption.bold) {
            be += "**";
        }

        if (tagOption.strike) {
            be += "~~"
        }
        if (tagOption.italic) {
            be += tagOption.bold ? "_" : "*";
        }
        if (!this.#pre) {
            return be;
        } else {
            be += this.#pre;
        }


        return be;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        let af = "";

        if (tagOption.italic) {
            af += tagOption.bold ? "_" : "*";
        }
        if (tagOption.strike) {
            af += "~~"
        }
        if (tagOption.bold) {
            af += "**";
        }

        if (!this.#after) {
            return af;
        } else {
            af = `${this.#after}${af}`;
        }

        return af;
    }
}

class BrFrame extends BaseFrame {
    constructor() {
        super();
    }
    getMarkdown(frame, areadyMD = "", workSpace) {
        workSpace.set("allowEmptyContent", true);
        return super.getMarkdown(frame, areadyMD, workSpace);
    }

    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "<br>";
    }
}

class AFrame extends BaseFrame {
    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return `[`;
    }
    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return "]("+tagOption.href + ")";
    }
}

class ImgFrame extends BaseFrame {
    constructor() {
        super();
    }

    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return `![${tagOption.name}](`
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        return this.getBefore(frame[0], frame[1], areadyMD, workSpace) + frame[1].src + this.getAfter(frame[0], frame[1], areadyMD, workSpace);
    }

    getAfter(tagName, tagOption, areadyMD = "", workSpace) {
        return ")";
    }
}

class BlockFrame extends BaseFrame {
    pre;
    #after;
    constructor(pre, after) {
        super();
        this.pre = pre;
        this.#after = after;
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {

        let p = areadyMD.endsWith("\n\n") ? "" : "\n";

        if (tagOption.list) {
            if (tagOption.list.isOrdered) {
                let listK = "listIndex_" + tagOption.list.listId + "_" + tagOption.list.level;

                let listIndex = workSpace.get(listK) || 0;

                let currentIndex = listIndex + 1;
                workSpace.set(listK, currentIndex, true);

                let intent = "";

                if (tagOption.list.level > 0) {
                    intent = "    ".repeat(tagOption.list.level);
                }

                p += `${intent}${currentIndex}. `;
            } else {
                p += "* ";
            }
        }


        if (!this.pre) {

        } else {
            p += `${this.pre}\n`
        }

        // 在表格里面的数据，每个单元格的数据不能换行。
        let inTable = workSpace.get("intable");
        if (inTable) {
            p = p.trim();
        }

        return p;
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {

        let af = "";
        if (!this.#after) {
            af = "\n\n";
        } else {
            af = `\n${this.#after}\n\n`;
        }

        // 在表格里面的数据，每个单元格的数据不能换行。
        let inTable = workSpace.get("intable");
        if (inTable) {
            af = af.trim();
        }

        return af;
    }
}

class CardFrame extends BlockFrame {
    constructor() {
        super("","");
    }


    getBefore(tagName, tagOption, areadyMD = "", workSpace) {
        return super.getBefore(tagName, tagOption, areadyMD, workSpace) + "[不支持的内容，请到钉钉文档查看](";
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        const getDocUrl = workSpace.get("getDdocUrl");
        return [this.getBefore(frame[0], frame[1], areadyMD, workSpace), getDocUrl("类型:" + frame[1].metadata.type), this.getAfter(frame[0], frame[1], areadyMD, workSpace)].join("");
    }

    getAfter(tagName, tagOption, areadyMD, workSpace) {
        return ")\n\n";
    }
}

class HrFrame extends BlockFrame {
    constructor() {
        super("---", "");
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        workSpace.set("allowEmptyContent", true);
        return super.getMarkdown(frame, areadyMD, workSpace);
    }
}

class CodeFrame extends BlockFrame {
    constructor() {
        super("```", "```");
    }

    getBefore(tagName, tagOption, areadyMD, workSpace) {
        let newLine = areadyMD.endsWith("\n\n") ? "" : "\n";
        let b = `${newLine}${this.pre}${tagOption.syntax||""}\n`;

        if (tagOption.title) {
            let cmt = getCommentMark(tagOption.syntax);
            b += `${cmt} ${tagOption.title}`;
            if (cmt.startsWith("<!--")) {
                b += ` -->`;
            } else if (cmt.startsWith("/*")) {
                b += ` */`;
            }

            b += `\n\n`;
        }

        return b;
    }
}

class TcFrame extends InlineFrame {
    constructor() {
        super("","");
    }
}

class TableFrame extends BaseFrame {
    constructor() {
        super();
    }

    getMarkdown(frame, areadyMD = "", workSpace) {
        let ctx = "";
        workSpace.set("intable", true); // 标记此frame 内部的解析是在 table 下面，数据不能换行。
        for (let i = 2; i < frame.length; i++) {
            let trFrame = frame[i];
            let trOption = trFrame[1];

            let trValues = [];
            for (let j = 2; j < trFrame.length; j++) {
                let tcFrame = trFrame[j];
                let f = getFrame(tcFrame[0]);
                if (!f) {
                    console.log(JSON.stringify(tcFrame, null, 2));
                    throw new Error(`不支持渲染节点：${tcFrame[0]}`);
                }

                trValues.push(f.getMarkdown(tcFrame, "",new WorkSpace(workSpace)).trim());
            }
            ctx += `| ${trValues.join(" | ")} |\n`;

            let tableHadHeaderKey = frame[1].uuid + "_hadheader";

            // 如果表没有设置表头，那么设置一个，markdown必须有表头分隔符才会渲染成表格的样式。
            if (!workSpace.get(tableHadHeaderKey)) {
                ctx += "|"
                for (let o  in trValues) {
                    ctx += " --- |";
                }
                ctx += "\n";

                workSpace.set(tableHadHeaderKey, true, true);

            } else {
                // 正常的行数据。
            }

        }

        return ctx + "\n";
    }

}


registFrame("h1", new HeaderFrame("#"));
registFrame("h2", new HeaderFrame("##"));
registFrame("h3", new HeaderFrame("###"));
registFrame("h4", new HeaderFrame("####"));
registFrame("h5", new HeaderFrame("#####"));
registFrame("br", new BrFrame());
registFrame("a", new AFrame());
registFrame("hr", new HrFrame());
registFrame("p", new BlockFrame("", ""));
registFrame("card", new CardFrame());
registFrame("container", new BlockFrame(":::", ":::"));
registFrame("tc", new TcFrame());
registFrame("span", new InlineFrame("", ""));
registFrame("inlineCode", new InlineFrame("`", "`"));
registFrame("code", new CodeFrame());
registFrame("root", new RootFrame());
registFrame("table", new TableFrame());
registFrame("img", new ImgFrame());


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
 * 传入 钉钉文档的 docContent 字符串。
 * @param docContent {string}
 * @param docUrl {string} // 有些内容markdown不支持的，那么这时，在markdown中输出文档地址，使得用户可以在打开原文。
 * @return {[string, string[]]} // 数组第一个是markdown结果，第二个是警告列表。
 */
function adoc2md(docContent, docUrl) {
    if (typeof docContent === "string") {
        docContent = JSON.parse(docContent);
    }
    let doc = Object.values(docContent.parts).find(p => p.type==="application/x-alidocs-word").data.body;
    let f = getFrame(doc[0]);
    if (!f) {
        throw new Error(`不支持渲染节点:${f}`);
    }
    const w =  new WorkSpace();
    const warns = [];
    w.set("getDdocUrl", (reason) => {
        warns.push(`发现不支持的内容[${reason}]。`);
        return docUrl;
    });
    return [f.getMarkdown(doc, "", w), warns];
}
module.exports = {
    adoc2md,
}