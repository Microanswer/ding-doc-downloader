const DentryItem = require("./dentryItem");
const {getDocList, getSpaceInfo} = require("../api");
const {dalert} = require("./dialog");
const DingTalkDomain = "alidocs.dingtalk.com";


module.exports = {
    render(h) {
        return h("div", {}, [
            h("div", {class: "label px-0"}, [
                h("div", {ref:"progressTip", class: "label-text"}, "我的文档"),
                h("div", {ref: "btnArea", class: "label-text"}, [
                    h("a", {ref: "downloadBtn", class: "link text-accent hidden", on: {click: this.onDownloadClick}}, "下载选中"),
                    h("a", {ref: "reloadBtn", class: "link text-accent hidden", on: {click: this.reload}}, "重新加载")
                ])
            ]),
            h("div", {class: "overflow-auto", style: {maxHeight: "700px"}}, [
                h("progress", {ref: "progress", class: "progress"}, []),
                h("ul", {ref: "list", class: "menu menu-xs bg-base-200 rounded-lg w-full hidden"}, this.dentrys.map(dentryInfo => {
                    return h("DentryItem", {ref: "di", props: () => ({dentryInfo: dentryInfo}), on: {selectChange: this.onDentrySelectChange}})
                }))
            ])
        ])
    },
    components: {
        DentryItem
    },
    created () {
    },
    mounted() {
        this.readCurrentPage();
    },
    methods: {
        readCurrentPage() {
            this.$refs.progressTip.classList.remove("text-error");
            this.$refs.progressTip.textContent = "正在读取当前页面...";
            this.$refs.progress.classList.remove("hidden");
            this.$refs.reloadBtn.classList.add("hidden");

            let href = window.location.href;
            if (href.indexOf(DingTalkDomain) === -1) {
                // 不在钉钉文档界面
                this.$refs.progressTip.classList.add("text-error");
                this.$refs.progressTip.textContent = "读取失败，当前页面不是钉钉文档页面。请打开钉钉文档页面后再打开本工具。";
                this.$refs.progress.classList.add("hidden");
                this.$emit("notdd");
                return;
            }

            // 打开了某个文件或目录
            if (href.includes("/i/nodes/")) {
                let dentryId = window.location.pathname.split("/").pop()
                this.getDocInfoAndChild(dentryId);
                return;
            }

            // 打开了自己的空间
            if (href.includes("/i/desktop/my-space")) {
                this.getMySpaceInfo();
                return;
            }

            // 打开了指定的空间
            if (href.includes("/i/spaces/")) {
                let spaceId = href.replace(/\/?overview/g, "").split("/").pop().trim();
                this.getSpaceInfo(spaceId);
                return;
            }

            // 没有打开任何地方
            this.$refs.progressTip.classList.remove("text-error");
            this.$refs.progressTip.textContent = "请打开某个知识库之后再运行本工具。";
            this.$refs.progress.classList.add("hidden");
            this.$refs.reloadBtn.classList.remove("hidden");
        },
        reload() {
            this.readCurrentPage();
        },
        async onDownloadClick() {
            let allDi = this.$refs.di;
            if (!allDi) {
                return;
            }
            if (!Array.isArray(allDi)) {
                allDi = [allDi];
            }

            try {
                // 先让用户选择一个目录保存。
                const dirHandle = await window.showDirectoryPicker();

                for (let i = 0; i < allDi.length; i++) {
                    await allDi[i].$download(dirHandle);
                }
            }catch (e) {
                dalert("出错", `下载出错了：${e.message}`);
            }

        },
        onDentrySelectChange(arg) {
            let dentry = arg.data;
            let selected = arg.selected;
            let index = this.selecteds.findIndex(sel => {
                return sel[sel.length - 1].dentryUuid === arg.data[arg.data.length - 1].dentryUuid;
            });

            if (index === -1 && selected) {
                this.selecteds.push(dentry);
            } else if(index !== -1 && !selected) {
                this.selecteds.splice(index, 1);
            }
        },
        async getDocInfoAndChild(dentryUuid) {
            const {data} = await getDocList(dentryUuid);

            // 还有更多数据，那么继续加载。
            while (data.hasMore) {
                const {data: moreData} = await getDocList(dentryUuid, data.loadMoreId);
                data.hasMore = moreData.hasMore;
                data.loadMoreId = moreData.loadMoreId;
                data.children = data.children.concat(moreData.children||[]);
            }

            this.$refs.progressTip.textContent = data.name;
            this.$refs.progress.classList.add("hidden");
            this.addDentry(data);
            this.$refs.list.classList.remove("hidden");
            this.$refs.downloadBtn.classList.remove("hidden");
        },
        async getMySpaceInfo() {
            const {data} = await getSpaceInfo();
            await this.getDocInfoAndChild(data.rootDentryUuid);
        },
        async getSpaceInfo(spaceId) {
            const {data} = await getSpaceInfo(spaceId);
            this.$refs.progressTip.textContent = data.name;
            await this.getDocInfoAndChild(data.rootDentryUuid);
        },
        addDentry(dentryInfo) {
            this.dentrys.push(dentryInfo);
            this.$refs.list.append(this.$createElement(h => {
                return h("DentryItem", {ref: "di", props: () => ({dentryInfo: dentryInfo, hasmoredata: false}), on: {selectChange: this.onDentrySelectChange}})
            }))
        }
    },
    data: {
        accessToken: "",
        selecteds: [],
        dentrys: [

        ],
    }
}
