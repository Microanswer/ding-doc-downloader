const Baby = require("./script/index");
const Main = require("./script/component/main");
const { dconfirm, dalert} = require("./script/component/dialog");
const CellRadios = require("./script/component/settings/cell_radios");
const {getCfg, CFG_KEY, setCfg} = require("./script/cfg");
const version = require("./script/version");

let ddddom = document.querySelector(`.my-dingdocdownloader`);

// 如果是本地调试，那么每次运行总是生成新的，干掉老的。
if (process.env.NODE_ENV === "development") {
    if (ddddom) {
        ddddom.remove();
        ddddom = null;
    }
}


if (ddddom) {
    ddddom.classList.remove("hidden");
} else {
    const ins = new Baby({
        render(h) {
            const dom =
                h("div", {
                    class: "my-dingdocdownloader ddddddoc-root dddd-card bg-base-100 shadow-xl border border-zinc-300",
                    style: {position: "fixed", right: "20px", bottom: "20px", zIndex: "10", width: "32rem"}
                }, [
                    h("div", {class: "dddd-card-body"}, [
                        h("h2", {class: "dddd-card-title flex flex-row"}, [
                            h("span", {class: "font-bold"}, `钉钉文档下载器`),
                            h("small", {class: "align-bottom"}, `v${version}`),
                            h("div", {class: "flex-grow"}, []),

                            h("button", {
                                title: "帮助&关于",
                                type: "button",
                                class: "dddd-btn dddd-btn-sm dddd-btn-xs dddd-btn-circle dddd-btn-ghost ml-auto",
                                style: {'fontSize': '13px'},
                                on: {click: this.onAboutClick}
                            }, "?"),
                            h("details", {ref: "menubtn", class: "dddd-dropdown dddd-dropdown-end hidden"}, [
                                h("summary", {class: "dddd-btn dddd-btn-ghost dddd-btn-xs dddd-btn-circle", title: "菜单", style: {display: "grid", fontSize: '14px'}}, "≡"),
                                h("ul", {class: "dddd-menu dddd-dropdown-content bg-base-100 rounded-box z-1 w-32 p-2 shadow-sm"}, [
                                    h("li", {class: "rounded-sm hover:bg-zinc-200"}, [h("a", {on: {click: this.onSettingsClick}}, "设置")]),
                                    h("li", {class: "rounded-sm hover:bg-zinc-200"}, [h("a", {on: {click: this.onAboutClick}}, "帮助&关于")])
                                ])
                            ]),
                            h("button", {
                                title: "关闭",
                                ref: "close",
                                type: "button",
                                class: "dddd-btn dddd-btn-sm dddd-btn-xs dddd-btn-circle dddd-btn-ghost ml-auto hidden",
                                style: {'fontSize': '20px'},
                                on: {click: this.onCloseClick}
                            }, "×"),
                        ]),
                        h("div", {ref: "container"}, [
                            h("p", null, "欢迎您使用钉钉文档下载器，点击【开始】按钮选择你要下载的文档。"),
                            h("div", {class: "mt-2 dddd-alert dddd-alert-warning", role: "alert"}, [
                                h("div", {class: "h-6 w-6 shrink-0 stroke-current", style:{fontSize: "19px"}}, "⚠"),
                                h("span", {class: ""}, "本工具仅作学习交流，请勿商用。由本工具造成的任何损失由用户自身承担，点击开始表示同意本政策。")
                            ])
                        ]),
                        h("div", {ref: "cardactions", class: "dddd-card-actions justify-end"}, [
                            h("button", {
                                ref: "actionBtnStart",
                                type: "button",
                                class: "dddd-btn dddd-btn-primary text-white",
                                on: {click: this.onStartClick}
                            }, "开始"),
                            h("button", {type: "button", class: "dddd-btn", on: {click: this.onExitClick}}, "退出")
                        ])
                    ])
                ]);

            return dom;
        },
        components: {mymain: Main, CellRadios: CellRadios},
        methods: {
            showCardActionsExit() {
                this.$refs.cardactions.classList.remove("hidden");
                this.$refs.actionBtnStart.classList.add("hidden");
            },
            onStartClick() {
                let _this = this;

                this.$refs.cardactions.classList.add("hidden");
                this.$refs.close.classList.remove("hidden");
                this.$refs.menubtn.classList.remove("hidden");

                this.$refs.container.innerHTML = "";
                let main = this.$createElement(function (h) {
                    return h("mymain", {on: {"dddd_notdd": _this.showCardActionsExit}});
                });
                this.$refs.container.append(main);
            },
            onCloseClick() {
                dconfirm("提示信息", "你确定要关闭钉钉文档下载工具吗？", () => {
                    this.exit();
                });
            },
            onSettingsClick(){
                this.$refs.menubtn.removeAttribute("open");
                showSettings.call(this);
            },
            onAboutClick() {
                this.$refs.menubtn.removeAttribute("open");
                showHelp$About.call(this);
            },
            onExitClick() {
                this.exit();
            },

            exit() {
                this.$el.remove();
            }
        }
    });
    const el = ins.$mount();
    document.body.append(el);
}


function showSettings() {
    dalert(`设置 - 钉钉文档下载器 v${version}`, this.$createElement(h => {
        return h("div", {class: ""}, [
            h("div", {class: "font-bold text-zinc-500 mb-1"}, "导出格式"),
            h("ul", {class: "flex flex-col gap-2 select-none"}, [

                h("CellRadios", {
                    props: {
                        title: "文档(.adoc)",
                        name: "adoc",
                        defaultValue: getCfg(CFG_KEY.EXPORT_ADOC_AS, ".docx"),
                        options: [
                            {label: "导出为 .docx", value: ".docx"},
                            {label: "导出为 .md", value: ".md"},
                            {label: "导出为 .pdf", value: ".pdf"},
                        ]
                    },
                    on: {change: (newOp) => {
                        setCfg(CFG_KEY.EXPORT_ADOC_AS, newOp.value);
                        if (newOp.value === ".md") {
                            this.$refs.mdtip.classList.remove("hidden");
                        } else {
                            this.$refs.mdtip.classList.add("hidden")
                        }
                    }}
                }),
                h("li", {ref: "mdtip", class: getCfg(CFG_KEY.EXPORT_ADOC_AS, ".docx") === ".md" ? "" : "hidden"}, [
                    h("div", {class: "mb-2 p-4 bg-amber-400 rounded rounded-md text-sm"}, [
                        h("div", {class: ""}, "您选择了导出为 .md 格式。钉钉文档有许多功能无法完全在Markdown上呈现，比如：文档内附件、文档内流程图等，如果某文档中存在这些内容，那么在导出的md文件中会显示为不支持，并提供原钉钉文档链接。建议选择导出格式为 .docx 或 .pdf"),
                    ])
                ]),
                h("CellRadios", {
                    props: {
                        title: "表格(.axls)",
                        name: "axls",
                        defaultValue: getCfg(CFG_KEY.EXPORT_AXLS_AS, ".xlsx"),
                        options: [
                            {label: "导出为 .xlsx", value: ".xlsx"}
                        ]
                    },
                    on: {change: (newOp) => {setCfg(CFG_KEY.EXPORT_AXLS_AS, newOp.value)}}
                }),
                h("CellRadios", {
                    props: {
                        title: "白板(.adraw)",
                        name: "adraw",
                        defaultValue: getCfg(CFG_KEY.EXPORT_ADRAW_AS, ".jpg"),
                        options: [
                            {label: "导出为 .jpg", value: ".jpg"}
                        ]
                    },
                    on: {change: (newOp) => {setCfg(CFG_KEY.EXPORT_ADRAW_AS, newOp.value)}}
                }),
                h("CellRadios", {
                    props: {
                        title: "脑图(.amind)",
                        name: "amind",
                        defaultValue: getCfg(CFG_KEY.EXPORT_AMIND_AS, ".jpg"),
                        options: [
                            {label: "导出为 .jpg", value: ".jpg"}
                        ]
                    },
                    on: {change: (newOp) => {setCfg(CFG_KEY.EXPORT_AMIND_AS, newOp.value)}}
                }),

                h("li", {class: "flex flex-row justify-between items-center px-3 py-1 bg-zinc-100 rounded-sm"}, [
                    h("div", {class: "text-xs text-zinc-600"}, "多维表格及快捷方式不支持导出。其它不属于钉钉体系文档的文件按原文件导出。"),
                ]),
            ]),
        ])
    }));
}

function showHelp$About() {
    dalert(`帮助&关于 - 钉钉文档下载器 v${version}`, this.$createElement(h => {
        return h("div", {}, [
            h("div", {class: "dddd-alert dddd-alert-warning mt-0", role: "alert"}, [
                h("div", {class: "h-6 w-6 shrink-0 stroke-current", style:{fontSize: "19px"}}, "⚠"),
                h("small", {}, "本工具仅作学习交流，请勿商用。由本工具造成的任何损失由用户自身承担，点击了开始表示您已同意本政策。")
            ]),


            h("div", {class: "mt-4"}, [
                h("div", {class: "font-bold"}, "使用方法"),
                h("ul", {}, [
                    h("li", {class: ""}, "1、勾选你要下载到本地的目录或文件夹。如果你勾选目录，会自动勾选该目录及其子目录下的所有内容。"),
                    h("li", {class: ""}, "2、点击【下载选中】按钮，选择一个本地目录进行保存。当某个文档名字前面出现了“✅”图标时，说明该文档已经下载完成。"),
                    h("li", {class: "mt-2"}, "【注意事项】1、全部下载完成后，下载到本地的文件目录结构和钉钉文档中的目录结构完全一致。2、工具只会从当前钉钉文档界面开始加载数据，如果你打开的是个目录，那么工具就看不到父目录及更上层的文档。"),
                ]),
            ]),

            h("div", {class: "mt-4"}, [
                h("div", {class: "font-bold"}, "版本变更记录"),
                h("div", {class: ""}, [
                    h("div", {}, "v1.0.2："),
                    h("ul", {}, [
                        h("li", {class: "text-sm text-zinc-600"}, "1、新增设置&菜单功能"),
                        h("li", {class: "text-sm text-zinc-600"}, "2、新增导出其它格式支持，取决于钉钉文档支持哪些导出格式。"),
                        h("li", {class: "text-sm text-zinc-600"}, "3、升级 tailwindcss 到4.1.4版本。"),
                        h("li", {class: "text-sm text-zinc-600"}, "4、升级 daisyui 到5.0.23版本。"),
                    ])
                ]),
                h("div", {class: ""}, [
                    h("div", {}, "v1.0.1："),
                    h("ul", {}, [
                        h("li", {class: "text-sm text-zinc-600"}, "1、修复目录下文件过多时，未进行分页加载导致的下载不全问题。"),
                    ])
                ]),
                h("div", {class: ""}, [
                    h("div", {}, "v1.0.0："),
                    h("ul", {}, [
                        h("li", {class: "text-sm text-zinc-600"}, "1、正式发布。"),
                    ])
                ]),
            ]),


            h("div", {class: "mt-4"}, [
                h("div", {class: "font-bold"}, [
                    h("span", {}, "欢迎您使用本工具，您可以在"),
                    h("a", {href:"https://github.com/Microanswer/ding-doc-downloader", target:"_blank", style: {color: "var(--color-primary)"}}, " Github "),
                    h("span", {}, "上提出您的建议，如果觉得有帮助期待您的 Star 和推广。")
                ])
            ])
        ])
    }))
}