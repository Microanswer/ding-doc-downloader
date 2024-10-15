const Baby = require("./script/index");
const Main = require("./script/component/main");
const { dconfirm} = require("./script/component/dialog");
const version = "1.0.0";

let ddddom = document.querySelector(`.my-dingdocdownloader`);
if (ddddom) {
    ddddom.classList.remove("hidden");
} else {
    const ins = new Baby({
        render(h) {
            const dom =
                h("div", {
                    class: "my-dingdocdownloader card bg-base-100 shadow-xl border",
                    style: {position: "fixed", right: "20px", bottom: "20px", zIndex: "10", width: "32rem"}
                }, [
                    h("div", {class: "card-body"}, [
                        h("h2", {class: "card-title"}, [
                            h("span", null, `钉钉文档下载器`),
                            h("small", {class: "align-bottom"}, `v${version}`),
                            h("button", {
                                ref: "close",
                                type: "button",
                                class: "btn btn-xs ml-auto hidden",
                                on: {click: this.onCloseClick}
                            }, "✕")
                        ]),
                        h("div", {ref: "container"}, [
                            h("p", null, "欢迎您使用钉钉文档下载器，点击【开始】按钮选择你要下载的文档。"),
                            h("div", {class: "mt-2 alert alert-warning", role: "alert"}, [
                                h("div", {class: "h-6 w-6 shrink-0 stroke-current", style:{fontSize: "19px"}}, "⚠"),
                                h("small", {}, "本工具仅作学习交流，请勿商用。由本工具造成的任何损失由用户自身承担，点击开始表示同意本政策。")
                            ])
                        ]),
                        h("div", {ref: "cardactions", class: "card-actions justify-end"}, [
                            h("button", {
                                ref: "actionBtnStart",
                                type: "button",
                                class: "btn btn-primary",
                                on: {click: this.onStartClick}
                            }, "开始"),
                            h("button", {type: "button", class: "btn", on: {click: this.onExitClick}}, "退出")
                        ])
                    ])
                ]);

            return dom;
        },
        components: {mymain: Main},
        methods: {
            showCardActionsExit() {
                this.$refs.cardactions.classList.remove("hidden");
                this.$refs.actionBtnStart.classList.add("hidden");
            },
            onStartClick() {
                let _this = this;

                this.$refs.cardactions.classList.add("hidden");
                this.$refs.close.classList.remove("hidden");

                this.$refs.container.innerHTML = "";
                let main = this.$createElement(function (h) {
                    return h("mymain", {on: {"notdd": _this.showCardActionsExit}});
                });
                this.$refs.container.append(main);
            },
            onCloseClick() {
                dconfirm("提示信息", "你确定要关闭钉钉文档下载工具吗？", () => {
                    this.exit();
                });
            },
            onExitClick() {
                this.exit();
            },

            exit() {
                this.$el.remove();
            }
        }
    })
    const el = ins.$mount();
    document.body.append(el);
}
