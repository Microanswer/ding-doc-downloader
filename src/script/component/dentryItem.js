const {getDocList, downloadBoard, httpDownload, downloadAmind, downloadAdoc, downloadAxls, downloadDocument} = require("../api");
const Loading = require("./loading");
const utils = require("../util");
const {dalert} = require("./dialog");
const DentryItem = {
    props: {
        dentryInfo: {type: Object}
    },
    components: {
        DentryItem: () => DentryItem,
        Loading: Loading
    },
    render(h) {

        let icon = "📄";
        let fileSize = "";
        if (this.dentryInfo.dentryType === "folder") {
            icon = "📁";
        } else {
            if (this.dentryInfo.fileSize) {
                fileSize = " [" + utils.beautifySize(this.dentryInfo.fileSize) + "]";
                fileSize = " [" + utils.beautifySize(this.dentryInfo.fileSize) + "]";
            } else {
                fileSize = " [未知大小]";
            }
        }
        let txt = this.dentryInfo.name + fileSize;

        if (!this.dentryInfo.hasChildren) {
            return h("li", {class: ""}, [h("a", {}, [
                h("input", {ref: "checkbox", class: "checkbox checkbox-xs", type: "checkbox", on: {change: this.onSelectChange}}),
                h("span", {on: {click: this.onDentryItemClick}, class: "whitespace-nowrap overflow-hidden overflow-ellipsis text-neutral", title: txt}, [
                    h("span", {class: "mr-2"}, [
                        icon,
                        h("span", {ref: "downloadStat", class: "ml-2 hidden"}, [
                            h("div", {ref: "downloadProgress", role:"progressbar", class: "radial-progress text-primary", style: {"--value": "0", "--size": "12px", "--thickness": "3px"}}, []),
                            h("span", {ref: "downloadResult", class: "hidden"}, "❗")
                        ])
                    ]),
                    h("span", {}, txt)
                ])
            ])]);
        }

        let childrenDom = [];
        if ((this.dentryInfo.children||[]).length > 0) {
            (this.dentryInfo.children||[]).map(child => {
                childrenDom.push(h("DentryItem", {ref: "di", on: {selectChange: this.onChildrenSelectChange}, props: () => ({dentryInfo: child})}))
            });
        }

        return h("li", {class: ""}, [   h("details", {ref: "details", open:false, on:{"toggle": this.onChildrenOpenChange}}, [
            h("summary", {}, [
                h("input", {ref: "checkbox", class: "checkbox checkbox-xs",type:"checkbox", on: {change: this.onSelectChange}}),
                h("span", {on: {click: this.onDentryItemClick}, class: "whitespace-nowrap overflow-hidden overflow-ellipsis", title: this.dentryInfo.name}, [
                    h("span", {class: "mr-2"}, [
                        h("span", {ref: "diricon"}, icon),
                        h("Loading", {ref: "loading", class: "hidden"}),
                        h("span", {ref: "downloadStat", class: "ml-2 hidden"}, [
                            h("div", {ref: "downloadProgress",role:"progressbar", class: "radial-progress text-primary", style: {"--value": "0", "--size": "12px", "--thickness": "3px"}}, []),
                            h("span", {ref: "downloadResult", class: "hidden"}, "❗")
                        ])
                    ]),
                    txt
                ])
            ]),
            h("ul", {ref: "children"}, childrenDom)
        ])])
    },
    methods: {
        onChildrenSelectChange(arg) {
            this.$emit("selectChange", {data: [this.dentryInfo, ...arg.data], selected: arg.selected});
        },
        onSelectChange(){
            let selected = this.$refs.checkbox.checked;
            this.$emit("selectChange", {data: [this.dentryInfo], selected: selected});

            // 如果选中的是一个目录，那么将目录下面的所有内容也选中。
            if (this.dentryInfo.hasChildren) {

                // 已经加载出来了数据，那么直接选中。
                if (this.dentryInfo.children && this.dentryInfo.children.length > 0) {
                    let di = this.$refs.di;
                    if (!di) return;
                    if (!Array.isArray(di)) {
                        di = [di];
                    }
                    for (let i = 0; i < di.length; i++) {
                        di[i].$select(selected);
                    }
                } else {
                    // 没有加载出来数据，那么立即加载。
                    this.loadChildrenData(selected);
                }
            }
        },
        onDentryItemClick() {
            if (!this.dentryInfo.hasChildren) {
                this.$refs.checkbox.checked = !this.$refs.checkbox.checked;
                this.onSelectChange();
            }
        },
        async loadChildrenData(selected) {
            this.$refs.diricon.classList.add("hidden");
            this.$refs.loading.$el.classList.remove("hidden");

            const {data} = await getDocList(this.dentryInfo.dentryUuid);
            this.dentryInfo.children = data.children;
            for (let i = 0; i < this.dentryInfo.children.length; i++) {
                this.addDentry(this.dentryInfo.children[i], selected);
            }

            this.$refs.diricon.classList.remove("hidden");
            this.$refs.loading.$el.classList.add("hidden");
        },
        onChildrenOpenChange() {
            // console.log("详情：", this.$refs.details.open, "是否选中：", this.$refs.checkbox.checked);

            // 如果是打开目录，但是目录下没有数据，那么尝试加载数据。
            if (this.$refs.details.open && (!this.dentryInfo.children || this.dentryInfo.children.length <= 0)) {
               this.loadChildrenData(this.$refs.checkbox.checked);
            }
        },

        addDentry(dentryInfo, selected) {
            const newdti = this.$createElement(h => {
                return h("DentryItem", {ref: "di", on: {selectChange: this.onChildrenSelectChange}, props: () => ({dentryInfo: dentryInfo})});
            });
            if (selected) {
                let di = this.$refs.di;
                if (!di) return;
                if (!Array.isArray(di)) {
                    di = [di];
                }
                for (let i = 0; i < di.length; i++) {
                    di[i].$select(selected);
                }
            }
            this.$refs.children.append(newdti);
        },

        // 选中或取消选中当前文件
        $select(select) {
            if (this.$refs.checkbox.checked === select) {
                return;
            }

            this.$refs.checkbox.checked = select;
            this.onSelectChange();
        },

        // 返回是否选中或有下级选中。
        $hasSelected() {
            let selected = this.$refs.checkbox.checked;
            if (selected) {
                return true;
            }

            // 如果有下级，那么继续
            let allDi = this.$refs.di;
            if (!allDi) {
                return false;
            }
            if (!Array.isArray(allDi)) {
                allDi = [allDi];
            }

            for (let i = 0; i < allDi.length; i++) {
                let s = allDi[i].$hasSelected();
                if (s) {
                    return s;
                }
            }

            return false;
        },

        // 如果本文件被选中了，那么下载本文件。
        async $download(dirHandler) {

            let selected = this.$refs.checkbox.checked; // 当前文件是否选中。
            let hasSelected = this.$hasSelected(); // 当前文件或下级内容是否有选中的。

            let currentName = utils.fixFileName(this.dentryInfo.name);

            let currentDirHandle = null;
            let currentFileHandler = null;

            // 当前文件是选中的，进行下载。
            if (selected) {
                if (this.dentryInfo.dentryType !== "folder") {
                    try {
                        let extension = this.dentryInfo.extension;
                        let newext = "";
                        if (extension === "adraw" || extension === "amind") {
                            newext = ".jpg";
                        } else if (extension === "adoc") {
                            newext = ".docx";
                        } else if (extension === "axls") {
                            newext = ".xlsx";
                        }

                        currentFileHandler = await dirHandler.getFileHandle(currentName + newext, {create: true});

                        this.$refs.downloadStat.classList.remove("hidden");

                        // 是个文件，那么按照文件类型下载。
                        let url = "";
                        if (extension === "adraw") {
                            url = await downloadBoard(this.dentryInfo.dentryKey, this.dentryInfo.docKey);
                        } else if (extension === "amind") {
                            url = await downloadAmind(this.dentryInfo.dentryKey, this.dentryInfo.docKey);
                        } else if (extension === "adoc") {
                            url = await downloadAdoc(this.dentryInfo.dentryUuid, this.dentryInfo.docKey, this.dentryInfo.dentryKey, this.dentryInfo.contentType, this.dentryInfo.name, this.dentryInfo.fileSize);
                        } else if (extension === "axls") {
                            url = await downloadAxls(this.dentryInfo.dentryUuid, this.dentryInfo.docKey, this.dentryInfo.dentryKey, this.dentryInfo.contentType, this.dentryInfo.name, this.dentryInfo.fileSize);
                        } else if (this.dentryInfo.contentType !== "alidoc" && this.dentryInfo.contentType !== "link") {
                            url = await downloadDocument(this.dentryInfo.dentryUuid);
                        } else {
                            throw new Error(`不支持此类型文件的下载：contentType=${this.dentryInfo.contentType},extension=${extension}`);
                        }

                        await httpDownload(url, currentFileHandler, (progressStat) => {
                            if (progressStat.type === "begin") {
                                // ..
                                // console.log("开始下载")
                            } else if (progressStat.type === "pending") {
                                // console.log("下载中" + progressStat.percent);
                                this.$refs.downloadProgress.style.setProperty("--value", String(progressStat.percent));
                            } else if (progressStat.type === "success") {
                                // console.log("下载中完成");
                                this.$refs.downloadProgress.classList.add("hidden");
                                this.$refs.downloadResult.classList.remove("hidden");
                                this.$refs.downloadResult.textContent = "✅";
                                this.$refs.downloadResult.title = "下载完成";
                            } else if (progressStat.type === "error") {
                                console.log("下载出错：" + progressStat.error);

                                this.$refs.downloadProgress.classList.add("hidden");
                                this.$refs.downloadResult.classList.remove("hidden");
                                this.$refs.downloadResult.textContent = "❗";
                                this.$refs.downloadResult.title = `下载出错：${progressStat.error}`;
                            }
                        });
                    }catch (e) {
                        console.log("下载请求出错：" + e.message);
                        this.$refs.downloadProgress.classList.add("hidden");
                        this.$refs.downloadResult.classList.remove("hidden");
                        this.$refs.downloadResult.textContent = "❗";
                        this.$refs.downloadResult.title = `下载请求出错：${e.message}`;
                    }
                }

                // 是个目录，那就只需要创建目录即可。
                if (this.dentryInfo.dentryType === "folder" || this.dentryInfo.hasChildren) {
                    currentDirHandle = await dirHandler.getDirectoryHandle(currentName + (this.dentryInfo.dentryType === "folder" ? "" : "_dir"), {create: true});
                }
            } else {
                // 当前文件没选中，但是可能子级有选中，这种情况，一定是要创建一个目录。
                if (hasSelected) {
                    currentDirHandle = await dirHandler.getDirectoryHandle(currentName + (this.dentryInfo.dentryType === "folder" ? "" : "_dir"), {create: true});
                }
            }

            if (hasSelected) {
                // 然后如果有下级，那么继续下载下级的。
                let allDi = this.$refs.di;
                if (!allDi) {
                    return;
                }
                if (!Array.isArray(allDi)) {
                    allDi = [allDi];
                }

                for (let i = 0; i < allDi.length; i++) {
                    await allDi[i].$download(currentDirHandle);
                }
            }
        }
    }
}

module.exports = DentryItem;
